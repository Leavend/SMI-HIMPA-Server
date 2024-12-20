import { AccessControl } from "accesscontrol";

let GrantObject = {
  ADMIN: {
    users: {
      "create:any": ["*"],
      "read:any": ["*"],
      "update:any": ["*"],
      "delete:any": ["*"],
    },
    borrows: {
      "create:any": ["*"],
      "read:any": ["*"],
      "update:any": ["*"],
      "delete:any": ["*"],
    },
  },
  EDITOR: {
    users: {
      "create:own": ["*"],
      "read:any": ["*"],
      "update:any": ["*"],
      "delete:own": ["*"],
    },
    borrows: {
      "create:own": ["*"],
      "read:own": ["*"],
      "update:own": ["*"],
      "delete:own": ["*"],
    },
  },
  CUSTOMER: {
    users: {
      "create:own": ["*"],
      "read:own": ["*"],
      "update:own": ["*"],
      "delete:own": ["*"],
    },
    borrows: {
      "create:own": ["*"],
      "read:own": ["*"],
      "update:own": ["*"],
      "delete:own": ["*"],
    },
  },
};

const Permissions = new AccessControl(GrantObject);
export default Permissions;
