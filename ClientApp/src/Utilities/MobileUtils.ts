export namespace MobileHelper {
    export function isiPhoneInStandalone() {
        //@ts-ignore
        return !!window.navigator["standalone"]
    }
}