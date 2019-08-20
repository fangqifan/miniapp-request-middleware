import extend from 'just-extend';
import { Middleware } from 'request-middleware-pipeline';
import Contracts from 'miniapp-middleware-contracts';

const defaultOptions = {
    url: '',
    data: {},
    header: {},
    method: 'GET',
    dataType: 'json',
    responseType: 'text',
    success: null,
    fail: null,
    complete: null,
};

const privateNames = {
    options: Symbol('options')
};

export default class extends Middleware {

    constructor(nextMiddleware, options) {
        super(nextMiddleware);

        this[privateNames.options] = extend(true, {}, defaultOptions, options);
    }

    async invoke(middlewareContext) {
        await this.next(middlewareContext);

        await new Promise((resolve, reject) => {
            const data = middlewareContext.data;
            const requestOptions = extend(
                true,
                {},
                this[privateNames.options],
                data[Contracts.WxRequestOptions] || {});
            const options = {
                success: (res) => {
                    data[Contracts.WxResponse] = res;
                    try {
                        requestOptions.success && typeof requestOptions.success === 'function' && requestOptions.success(res);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                },
                fail: (res) => {
                    data[Contracts.WxResponse] = res;
                    try {
                        requestOptions.fail && typeof requestOptions.fail === 'function' && requestOptions.fail(res);
                   
                        reject(res);
                    } catch (err) {
                        reject(err);
                    }
                },
            };

            wx.request(extend({}, requestOptions, options));
        });
    }

    config(options) {
        this[privateNames.options] = extend(true, this[privateNames.options], options);
    }
}
