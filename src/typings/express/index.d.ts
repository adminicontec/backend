declare namespace Express {
    // @export_request
    export interface Request {
        // @request_vars
        user?     : any,
        setLocale?: any,
        getLocale?: any,
        files?    : any,
        getParameters: any
        // @end
    }
    // @end

    // @export_response
    export interface Response {
        // @response_vars
        __?: any,
        token? : string
        service?: any
        // @end
    }
    // @end
}
