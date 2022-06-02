function urlBase64ToUint8Array(base64String: string) {
  let padding = '='.repeat((4 - base64String.length % 4) % 4);
  let base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  let rawData = window.atob(base64);
  let outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class ServiceWorker {

  protected registration?: ServiceWorkerRegistration;
  private readyPromise: Promise<any>;

  constructor(path: string) {
    this.readyPromise = this.init(path);
  }

  public get isReady(): Promise<void> {
    return new Promise(resolve => {
      this.readyPromise.then(() => resolve());
    });
  }

  protected async init(path: string) {
    this.registration = await navigator.serviceWorker.register(path);
  }

}

export class PushNotificationWorker extends ServiceWorker {

  private publicKey?: Uint8Array;

  protected async init(path: string) {
    super.init(path);
    this.publicKey = await this.getPublicKey();
  }

  public get isSubscribed() {
    return new Promise<boolean>(resolve => {
      this.getExistingSubscription().then(subscription => {
        resolve(!!subscription);
      });
    });
  }

  public async subscribe() {
    let result = false;
    const subscription = await this.getSubscription();
    if (subscription) {
      const resp = await fetch("api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: subscription }),
        headers: {
          "Content-type": "application/json"
        }
      });
      if (resp.ok || resp.status === 304) {
        result = true;
      }
    }
    return result;
  }

  public async unsubscribe() {
    let result = false;
    const subscription = await this.getExistingSubscription();
    if (subscription) {
      const resp =await fetch("api/notifications/unsubscribe", {
        method: "DELETE",
        body: JSON.stringify({ subscription: subscription }),
        headers: {
          "Content-type": "application/json"
        }
      });
      if (resp.ok || resp.status === 304) {
        result = true;
      }
    }
    return result;
  }

  private async getSubscription() {
    await this.isReady;
    let subscription = await this.getExistingSubscription();
    if (!subscription) {
      subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.publicKey
      });
    }
    return subscription;
  }

  private async getExistingSubscription() {
    return await this.registration!.pushManager.getSubscription();
  }

  private async getPublicKey() {
    let vapidResponse = await fetch('/api/notifications/publickey');
    if (vapidResponse.ok) {
      const encodedKey = await vapidResponse.text();
      const key = urlBase64ToUint8Array(encodedKey);
      return key;
    } else {
      console.warn("Failed to get notification public key");
      return undefined;
    }
  }
}