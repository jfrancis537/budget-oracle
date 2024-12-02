import { AuthAPI } from "../../APIs/AuthAPI";
import { Action } from "../../Utilities/Action";
import { AuthorizationError } from "../../Utilities/Errors/AuthorizationError";

class UserManager {
  public readonly onuserloggedin: Action<void>;
  public readonly onuserloggedout: Action<void>;

  private _username: string | undefined;

  constructor() {
    this.onuserloggedin = new Action();
    this.onuserloggedout = new Action();
  }

  public async init() {
    let username = await AuthAPI.getUsername();
    if (username) {
      this._username = username;
    }
    if (this.isLoggedIn) {
      this.onuserloggedin.invoke();
      this.autoLogout();
    }
  }

  public get isLoggedIn() {
    return !!this._username;
  }

  public get username(): string {
    return this._username ?? "";
  }

  public async login(username: string, password: string) {
    await AuthAPI.login(username, password);
    //call will fail and this point will not be reached if login failed
    this._username = username;
    if (this.isLoggedIn) {
      this.onuserloggedin.invoke();
    }
  }

  public async logout() {
    try {
      await AuthAPI.logout();
    } catch (err) {
      if (err instanceof AuthorizationError) {
        //TODO
      } else {
        //TODO
      }
    } finally {
      this._username = undefined;
      this.onuserloggedout.invoke();
    }
  }

  public async register(username: string, password: string, confirmPassword: string) {
    await AuthAPI.register(username, password, confirmPassword);
  }

  public async autoLogout() {
    while (this.isLoggedIn) {
      if (!(await AuthAPI.getUsername())) {
        this.logout();
      }
      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));
    }
  }
}

const instance = new UserManager();
export { instance as UserManager }