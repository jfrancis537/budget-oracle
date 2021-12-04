import { AuthAPI } from "../../APIs/AuthAPI";
import { DataAPI } from "../../APIs/DataAPI";
import { Action } from "../../Utilities/Action";

class UserManager {
  public readonly onuserloggedin: Action<void>;
  public readonly onuserloggedout: Action<void>;
  public readonly onstockapikeychanged: Action<string>;

  private _username: string | undefined;
  private _stockApiKey: string | undefined;

  constructor() {
    this.onuserloggedin = new Action();
    this.onuserloggedout = new Action();
    this.onstockapikeychanged = new Action();
  }

  public async init() {
    let username = await AuthAPI.getUsername();
    if (username) {
      this._username = username;
    }
    try {
      let apiKey = await DataAPI.getStockAPIKey();
      if (apiKey) {
        this._stockApiKey = apiKey;
        this.onstockapikeychanged.invoke(apiKey);
      }
    } catch (err) {
      //TODO handle the error
    }
    if (this.isLoggedIn) {
      this.onuserloggedin.invoke();
    }
  }

  public get isLoggedIn() {
    return !!this._username;
  }

  public get username(): string {
    return this._username ?? "";
  }

  public get hasStockApiKey() {
    return !!this._stockApiKey;
  }

  public get stockApiKey(): string {
    return this._stockApiKey ?? "";
  }

  public async login(username: string, password: string) {
    await AuthAPI.login(username, password);
    //call will fail and this point will not be reached if login failed
    this._username = username;
    try {
      let apiKey = await DataAPI.getStockAPIKey();
      if (apiKey) {
        this._stockApiKey = apiKey;
        this.onstockapikeychanged.invoke(apiKey);
      }
    } catch (err) {
      //TODO handle the error
    }
    if (this.isLoggedIn) {
      this.onuserloggedin.invoke();
    }
  }

  public async logout() {
    await AuthAPI.logout();
    this.onuserloggedout.invoke();
  }

  public async setStockAPIKey(key: string) {
    if (this.isLoggedIn) {
      await DataAPI.updateStockAPIKey(key);
      this._stockApiKey = key;
      this.onstockapikeychanged.invoke(key);
    }
  }

  public async register(username: string, password: string, confirmPassword: string) {
    await AuthAPI.register(username, password, confirmPassword);
  }
}

const instance = new UserManager();
export { instance as UserManager }