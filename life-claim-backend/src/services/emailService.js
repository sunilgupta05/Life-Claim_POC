const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const util = require("util");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const connection = require("../config/dbConfig");

const con = connection;
const app = express();
const port = 5000;
const isProduction = process.env.NODE_ENV === 'production';

/** Same DMS credentials as document upload — no hardcoded Alfresco passwords in source. */
const getDmsBasicAuthHeader = () => {
  const dmsUserId =
    process.env.DMS_USER_ID ||
    (!isProduction ? 'admin' : '');
  const dmsPassword =
    process.env.DMS_PASSWORD ||
    (!isProduction ? 'admin' : '');
  if (!dmsUserId || !dmsPassword) {
    return null;
  }
  return `Basic ${Buffer.from(`${dmsUserId}:${dmsPassword}`).toString('base64')}`;
};
const emailTlsInsecure =
  process.env.EMAIL_TLS_INSECURE === 'true' ||
  (!isProduction && process.env.EMAIL_TLS_INSECURE !== 'false');

// IMAP configuration
const imapConfig = {
  user: process.env.EMAIL_ID,
  password: process.env.EMAIL_PASS,
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  tls: true,
  // Secure by default in production; allow explicit insecure mode for local/self-signed IMAP.
  tlsOptions: { rejectUnauthorized: !emailTlsInsecure },
  autoReconnect: true,
  automaticReconnect: true,
  automaticReconnectInterval: 100000,
  connTimeout: 30000, // 30 seconds connection timeout
  authTimeout: 30000, // 30 seconds authentication timeout
  keepalive: true,
};

const INWARD_CODE = "INW";

// Utility function to generate Inward ID
const generateInwardID = (lastReadId) => {
  let padded_num = lastReadId.toString().padStart(7, "0");
  return INWARD_CODE + padded_num;
};

// Utility function to open inbox
const openInbox = (imap) => {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", true, (err, box) => {
      if (err) return reject(err);
      resolve(box);
    });
  });
};

// Utility function to get last read ID from the database
const getLastReadId = async () => {
  const [results] = await con.query("SELECT * FROM inbox ORDER BY inward_id DESC LIMIT 1");
  if (results.length > 0) {
    return results[0].inward_id;
  }
  return null;
};

// Function to save mail data to the database
const saveMailToDB = async (mail, id) => {
  const lastReadId = await getLastReadId();
  let actualInteger_lastReadId = lastReadId
    ? parseInt(lastReadId.slice(INWARD_CODE.length), 10)
    : 0;

  if (!actualInteger_lastReadId || id > actualInteger_lastReadId) {
    const generatedInwardID = generateInwardID(id);
    const query =
      "INSERT INTO inbox (inward_id, subject, `from`, text_body, date, time) VALUES (?, ?, ?, ?, ?, ?)";
    const dateArr = mail.date.toLocaleDateString().split("/");
    const dataObj = [
      generatedInwardID,
      mail.subject,
      mail.from.value.map((f) => f.address).join(", "),
      mail.text,
      `${dateArr[1]}/${dateArr[0]}/${dateArr[2]}`,
      mail.date.toLocaleTimeString(),
    ];
    await con.query(query, dataObj);

    if (mail.attachments.length > 0) {
      await saveAttachmentsToDB(mail.attachments, generatedInwardID);
    }
  }
};

var AlfrescoIDtoUpdate;

const saveAttachmentsToDB = async (attachments, inwardId) => {
  const attachmentQuery =
    "INSERT INTO attachment (inward_id, document_name, document_type, created_on, ALF_DocID) VALUES (?, ?, ?, ?,?)";

  let countOfAttachment = 0;
  let parentFolderID; // Declare parentFolderID here

  for (const attachment of attachments) {
    if (attachment.filename) {
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const formattedTime = now.toTimeString().slice(0, 8); // HH:MM:SS
      ++countOfAttachment;
      parentFolderID = await saveAttachmentToFileSystem(attachment, inwardId, countOfAttachment, parentFolderID);
      
      const attachmentDataObj = [
        inwardId,
        attachment.filename,
        attachment.contentType,
        `${formattedDate}, ${formattedTime}`,
        AlfrescoIDtoUpdate
      ];
      
      await con.query(attachmentQuery, attachmentDataObj);
    }
  }
};

// Function to save attachment to the file system and upload to cloud storage
const saveAttachmentToFileSystem = async (attachment, inwardId, countOfAttachment, parentFolderID) => {
  // Security: Sanitize filename to prevent path traversal
  const sanitizedFilename = path.basename(attachment.filename).replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const attachmentPath = path.join(__dirname, "../attachments", sanitizedFilename);
  const decodedContent = Buffer.from(attachment.content, "base64");

  fs.writeFileSync(attachmentPath, decodedContent);

  const alfresco_API_URL = process.env.alfresco_API_URL;
  const authHeader = getDmsBasicAuthHeader();

  const folderData = {
    name: `${inwardId}`,
    nodeType: "cm:folder"
  };

  const formDataForAttachments = new FormData();
  formDataForAttachments.append("filedata", fs.createReadStream(attachmentPath));

  const BasefolderID = "3f5b4fa2-d4fe-4e88-ac20-f48276f8170e";

  try {
    if (!alfresco_API_URL || !authHeader) {
      console.error(
        'Email attachment upload skipped: set alfresco_API_URL and DMS_USER_ID / DMS_PASSWORD (or dev defaults).'
      );
      fs.unlinkSync(attachmentPath);
      return parentFolderID;
    }

    if (countOfAttachment === 1) {
      const folderCreatedResponse = await axios.post(
        `${alfresco_API_URL}${BasefolderID}/children`, folderData, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json'
          }
        }
      );
      parentFolderID = folderCreatedResponse.data.entry.id;
    }

    const uploadResponse = await axios.post(
      `${alfresco_API_URL}${parentFolderID}/children`, formDataForAttachments, {
        headers: {
          Authorization: authHeader,
          //...formDataForAttachments.getHeaders()
        }
      }
    );

    //console.log(uploadResponse.data.entry);

    AlfrescoIDtoUpdate  = uploadResponse.data.entry.id; // setting globally so can use for inserting attachment table in DB
  
    fs.unlinkSync(attachmentPath);
  } catch (uploadError) {
    console.error("Error uploading to cloud storage:", uploadError);
  }

  return parentFolderID; // Return the parentFolderID
};


// Function to read previous mails
const readPreviousMails = async () => {
  const imap = new Imap(imapConfig);
  
  // Set up connection timeout
  const connectionTimeout = setTimeout(() => {
    if (imap && imap.state !== 'authenticated' && imap.state !== 'ready') {
      console.error("IMAP connection timeout - closing connection");
      imap.end();
    }
  }, 60000); // 60 seconds total timeout

  imap.once("ready", async () => {
    clearTimeout(connectionTimeout);
    try {
      const box = await openInbox(imap);
      const results = await util.promisify(imap.search).bind(imap)(["ALL"]);
      const fetch = imap.fetch(results, { bodies: "" });

      fetch.on("message", (msg) => {
        let buffer = "";
        let id;
        msg.once("attributes", (attrs) => {
          id = attrs.uid;
        });

        msg.on("body", (stream) => {
          stream.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
          });

          stream.once("end", async () => {
            const mail = await simpleParser(buffer);
            await saveMailToDB(mail, id);
          });
        });
      });

      fetch.once("error", (err) => {
        console.error("Fetch error:", err);
      });

      fetch.once("end", () => {
        console.log("Done fetching all messages!");
        imap.end();
      });
    } catch (err) {
      console.error("Error reading previous mails:", err);
      imap.end();
    }
  });

  imap.once("error", (err) => {
    clearTimeout(connectionTimeout);
    console.error("IMAP error:", err.message || err);
    if (err.message && err.message.includes("Timed out while authenticating")) {
      console.error("Authentication timeout - check email credentials and server availability");
    } else if (err.code === "ECONNRESET") {
      console.log("Connection reset by server. Reconnecting...");
      setTimeout(() => {
        if (imap.state !== 'authenticated' && imap.state !== 'ready') {
          imap.connect();
        }
      }, 10000);
    }
  });

  imap.once("end", () => {
    clearTimeout(connectionTimeout);
    console.log("IMAP connection ended");
  });

  try {
    imap.connect();
  } catch (err) {
    clearTimeout(connectionTimeout);
    console.error("Failed to initiate IMAP connection:", err.message || err);
  }
};

// Function to handle new mail
const handleNewMail = async (id, mail) => {
  await saveMailToDB(mail, id);
};

// Function to listen to inbox for new emails
const listenToInbox = (config, onNewMail) => {
  let connectionTimeout;
  let reconnectTimeout;
  
  const connectToIMAP = () => {
    const imap = new Imap(config);
    const openBox = util.promisify(imap.openBox).bind(imap);

    // Set up connection timeout
    connectionTimeout = setTimeout(() => {
      if (imap && imap.state !== 'authenticated' && imap.state !== 'ready') {
        console.error("IMAP connection timeout - closing connection");
        imap.end();
      }
    }, 60000); // 60 seconds total timeout

    imap.once("ready", async () => {
      clearTimeout(connectionTimeout);
      try {
        await openBox("INBOX", true);
        console.log("Listening for new emails...");
      } catch (err) {
        console.error("Error opening inbox:", err);
        imap.end();
        return;
      }

      imap.on("mail", (numNewMsgs) => {
        console.log(`New mail arrived: ${numNewMsgs}`);
        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            console.error("Search error:", err);
            return;
          }
          if (!results || !results.length) return;

          const fetch = imap.fetch(results, { bodies: "" });

          fetch.on("message", (msg, seqno) => {
            console.log(`Processing message #${seqno}`);
            let buffer = "";
            let id;
            msg.once("attributes", (attrs) => {
              id = attrs.uid;
            });

            msg.on("body", (stream) => {
              stream.on("data", (chunk) => {
                buffer += chunk.toString("utf8");
              });

              stream.once("end", async () => {
                const mail = await simpleParser(buffer);
                onNewMail(id, mail);
              });
            });
          });

          fetch.once("error", (err) => {
            console.error("Fetch error:", err);
          });

          fetch.once("end", () => {
            console.log("Done fetching all unseen messages.");
          });
        });
      });
    });

    imap.once("error", (err) => {
      clearTimeout(connectionTimeout);
      console.error("IMAP error:", err.message || err);
      if (err.message && err.message.includes("Timed out while authenticating")) {
        console.error("Authentication timeout - check email credentials and server availability");
      }
      // Attempt to reconnect after 10 seconds
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        console.log("Attempting to reconnect to IMAP server...");
        connectToIMAP();
      }, 10000);
    });

    imap.once("end", () => {
      clearTimeout(connectionTimeout);
      console.log("IMAP connection ended.");
      // Attempt to reconnect after 10 seconds
      clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        console.log("Attempting to reconnect to IMAP server...");
        connectToIMAP();
      }, 10000);
    });

    try {
      imap.connect();
    } catch (err) {
      clearTimeout(connectionTimeout);
      console.error("Failed to initiate IMAP connection:", err.message || err);
      reconnectTimeout = setTimeout(() => {
        console.log("Attempting to reconnect to IMAP server...");
        connectToIMAP();
      }, 10000);
    }
  };

  connectToIMAP();
};

// Start reading previous mails from inbox and listening to inbox.
// For safety, this is DISABLED by default and only runs when EMAIL_ENABLED=true is set.
if (process.env.EMAIL_ENABLED === "true") {
  if (process.env.EMAIL_ID && process.env.EMAIL_PASS && process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    try {
      readPreviousMails();
      // Start listening to the inbox
      listenToInbox(imapConfig, handleNewMail);
    } catch (error) {
      console.error("Failed to initialize email service:", error.message || error);
      console.log("Email service will not be available. Check your email configuration.");
    }
  } else {
    console.warn("Email service not initialized: Missing email configuration in environment variables");
    console.warn("Required: EMAIL_ID, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT");
  }
}

module.exports = {
  handleNewMail,
};
