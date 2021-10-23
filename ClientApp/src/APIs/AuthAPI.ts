export namespace AuthAPI {
  export async function getUsername() {
    let url = "/api/auth/username";
    let response = await fetch(url);
    if (response.ok) {
      return await response.text();
    } else {
      return undefined;
    }
  }
  export async function login(username: string, password: string) {
    let url = "/api/auth/login";
    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        username,
        password
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Login failed, make sure your username and password are correct.");
    }
  }

  export async function register(username: string, password: string, confirmPassword: string) {
    let url = "/api/auth/register";
    let response = await fetch(url, {
      method: "PUT",
      body: JSON.stringify({
        username,
        password,
        confirmPassword
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      let text = await response.text();
      throw new Error(text);
    }
  }

  export async function logout() {
    let url = "/api/auth/logout";
    let response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unknown server error.");
    }
  }
}