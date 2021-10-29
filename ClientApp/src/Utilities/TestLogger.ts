class TestLogger {
    private currentTest: string | undefined;
    private logsEnabled: boolean = false;

    public setLogsEnabled(bool: boolean) {
        let current = this.logsEnabled;
        this.logsEnabled = bool;
        return current;
    }

    public log(...args: any[]) {
        if (this.logsEnabled) {
            console.log(...args);
        }
    }

    public setTest(name: string) {
        this.currentTest = name;
    }

    public logForTest(testName: string, ...args: any[]) {
        if (this.currentTest === testName) {
            console.log(...args);
        }
    }
}

let instance = new TestLogger();

export { instance as TestLogger }