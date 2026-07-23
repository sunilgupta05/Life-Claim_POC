import wrapper from '../util/ApiWrapper';


const roleService = {
    
    getRoles: async () => {
      const response = await wrapper.fetchWithToken(`/role/getroles`);
      const data = await response.json();
      return data;
    },
  
    addRoles: async (roleData) => { // Changed from createUser to addUser
      const response = await wrapper.fetchWithToken("/role/addrole", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roleData)
      });
      const data = await response.json().catch(() => null);
      
      return data;
    },
  
}
  
  export default roleService;