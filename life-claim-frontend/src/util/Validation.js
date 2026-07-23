import { toast } from "react-toastify";

// Function for mobile number validation
export const onBlurMobileNo = (e) => {
  const newValue = e.target.value;
  if (newValue.length !== 10) {
    toast.error("Mobile number must be exactly 10 digits!", {
      autoClose: 2000,
    });
  }
};

export const blockNegative=(event)=> {
  if (event.key === '-' || event.key === 'e') {
      event.preventDefault();
  }
}

export const onBlurTelNo = (e) => {
  const newValue = e.target.value;
  if (newValue.length !== 7) {
    toast.error("Telephone number must be exactly 7 digits!", {
      autoClose: 2000,
    });
  }
};


export const onBlurAge = (e) => {
    const newValue = e.target.value;
    if (newValue.length <1) {
      toast.error("Please add proper age!", {
        autoClose: 2000,
      });
    }
  };
 export const  onBlurPinCode=(e) => {
    const newValue = e.target.value;

    if (newValue.length !== 6) {
      toast.error("Pin code must be exactly 6 digits!", {
        autoClose: 2000,
      });
    }
  }
export const onBlurEmail=(e) => {
    const newValue = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newValue)) {
      toast.error("Invalid email format!", {
        autoClose: 2000,
      });
    }
  }