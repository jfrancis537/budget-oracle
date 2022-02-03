/// <reference lib="WebWorker" />

// export empty type because of tsc --isolatedModules flag

// interface IPushNotification {
// 	title: string;
// 	message: string;
// }

class PushNotificationWorker {

  constructor() {
    this.handlePush = this.handlePush.bind(this);
  }

  start() {
    self.addEventListener('push', this.handlePush);
  }

  handlePush(event) {
    const data = event.data?.json();
    if (data) {
      const options = {
        lang: "en-US",
        body: data.message,
        icon: undefined,
        vibrate: [500, 100, 500]
      };
      event.waitUntil(self.registration.showNotification(data.title, options))
    }
  }
}

const instance = new PushNotificationWorker();
instance.start();