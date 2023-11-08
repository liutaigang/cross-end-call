class CecClient{
    constructor() {

    }

    call(name: string, ...args: any[]): Promise<any> {
        return new Promise<any>(() => {});
    }

    subscrible(name: string, receiver: (...args: any[]) => void) {
        
    }
}