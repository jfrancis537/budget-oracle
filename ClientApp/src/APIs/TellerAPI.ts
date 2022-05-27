import { LinkedAccount, TellerEnrollment } from "../Processing/Managers/TellerManager";

interface IEnrollment {
  accessToken: string,
  id: string,
  userId: string
}

export namespace TellerAPI {
  const baseUrl = "/api/teller";
  export async function getTellerUserId(): Promise<string | undefined> {
    let url = `${baseUrl}/get/userid`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.text();
    } else if (response.status === 404) {
      return undefined;
    } else {
      throw new Error("Failed to get teller user id.");
    }
  }

  export async function getEnrollments(): Promise<IEnrollment[]> {
    let url = `${baseUrl}/get/enrollments`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.json() as IEnrollment[];
    } else {
      throw new Error("Failed to get enrollment data.");
    }
  }

  export async function addEnrollment(enrollment: TellerEnrollment): Promise<void> {
    let url = `${baseUrl}/add/enrollment`;
    let response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(enrollment)
    });
    if (!response.ok) {
      throw new Error("Failed to create enrollment data.");
    }
  }

  export async function setTellerUserId(id: string): Promise<void> {
    let url = `${baseUrl}/set/userid/${id}`;
    let response = await fetch(url, {
      method: "PUT"
    });
    if (!response.ok) {
      throw new Error("Failed to set id.");
    }
  }

  export async function getEnrollmentData(id: string): Promise<LinkedAccount[]> {
    let url = `${baseUrl}/get/accounts/${id}`;
    let response = await fetch(url, {
      method: "GET"
    });
    if (response.ok) {
      return await response.json() as LinkedAccount[]
    } else {
      throw new Error("Failed to get data");
    }
  }
}

