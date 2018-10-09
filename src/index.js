import extend from 'just-extend';
import {Middleware} from 'request-middleware-pipeline';
import WechatContextNames from 'miniapp-middleware-contracts';

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

const privateNames={
    options:Symbol('options')
};

export default class WechatRequestMiddleware extends Middleware {

    constructor(nextMiddleware,options){
        super(nextMiddleware);

        this[privateNames.options]=extend(true,{},defaultOptions,options);
    }

    async invoke(middlewareContext) {
        await this.next(middlewareContext);

        await new Promise((resolve, reject) => {
            const data = middlewareContext.data;
            const requestOptions = extend(
                true,
                {},
                this[privateNames.options],
                data[WechatContextNames.WxRequestOptions] || {});
            const options = {
                success: (res) => {
                    data[WechatContextNames.WxResponse] = res;
                    data[WechatContextNames.WxResponseData] = res.data;
                    try {
                        requestOptions.success && typeof requestOptions.success === 'function' && requestOptions.success(res);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                },
                fail: (res) => {
                    data[WechatContextNames.WxResponse] = res;
                    try {
                        requestOptions.fail && typeof requestOptions.fail === 'function' && requestOptions.fail(res);
                        //TODO:reject应该回传什么?
                        reject('wxrequest is faild');
                    } catch (err) {
                        reject(err);
                    }
                },
            };

            wx.request(extend({}, requestOptions, options));
        });
    }

    config(options){
        this[privateNames.options] = extend(true, this[privateNames.options], options);
    }
}
