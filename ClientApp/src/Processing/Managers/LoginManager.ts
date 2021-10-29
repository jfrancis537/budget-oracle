import { AuthAPI } from "../../APIs/AuthAPI";
import { Action } from "../../Utilities/Action";

class LoginManager {
  public onuserloggedin: Action<void>;
  public onuserloggedout: Action<void>;
  private loggedIn: boolean;
  private _username: string | undefined;

  constructor() {
    this.loggedIn = false;
    this.onuserloggedin = new Action();
    this.onuserloggedout = new Action();
  }

  public async init() {
    let username = await AuthAPI.getUsername();
    if (username) {
      this._username = username;
      this.loggedIn = true;
      this.onuserloggedin.invoke();
    }
  }

  public get isLoggedIn() {
    return this.loggedIn;
  }

  public get username(): string {
    return this._username ?? "";
  }

  public async login(username: string, password: string) {
    await AuthAPI.login(username, password);
    //call will fail and this point will not be reached if login failed
    this._username = username;
    this.loggedIn = true;
    this.onuserloggedin.invoke();
  }

  public async logout() {
    await AuthAPI.logout();
    this.onuserloggedout.invoke();
  }

  public async register(username: string, password: string, confirmPassword: string) {
    await AuthAPI.register(username, password, confirmPassword);
  }
}

const instance = new LoginManager();
export { instance as LoginManager }