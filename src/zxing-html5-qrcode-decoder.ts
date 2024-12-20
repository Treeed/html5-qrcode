/**
 * @fileoverview
 * {@interface QrcodeDecoder} wrapper around ZXing library.
 * 
 * @author mebjas <minhazav@gmail.com>
 * 
 * ZXing library forked from https://github.com/zxing-js/library.
 * 
 * The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
 * http://www.denso-wave.com/qrcode/faqpatent-e.html
 */

import * as ZXing_wasm from "zxing-wasm";

import {
    Html5QrcodeSupportedFormats,
    Logger,
    QrcodeDecoderAsync,
    QrcodeResult,
    QrcodeResultDebugData,
    QrcodeResultFormat
} from "./core";
import {defaultReaderOptions} from "zxing-wasm";

/**
 * ZXing based Code decoder.
 */
export class ZXingHtml5QrcodeDecoder implements QrcodeDecoderAsync {

    private readonly formatMap: Map<Html5QrcodeSupportedFormats, any>
        = new Map([
            [Html5QrcodeSupportedFormats.QR_CODE, "QRCode" ],
            [Html5QrcodeSupportedFormats.AZTEC, "Aztec"],
            [Html5QrcodeSupportedFormats.CODABAR,"Codabar"],
            [Html5QrcodeSupportedFormats.CODE_39, "Code39"],
            [Html5QrcodeSupportedFormats.CODE_93, "Code93"],
            [Html5QrcodeSupportedFormats.CODE_128, "Code128"],
            [Html5QrcodeSupportedFormats.DATA_MATRIX, "DataMatrix"],
            [Html5QrcodeSupportedFormats.MAXICODE, "MaxiCode"],
            [Html5QrcodeSupportedFormats.ITF, "ITF"],
            [Html5QrcodeSupportedFormats.EAN_13, "EAN-13"],
            [Html5QrcodeSupportedFormats.EAN_8, "EAN-8"],
            [Html5QrcodeSupportedFormats.PDF_417, "PDF417"],
            [Html5QrcodeSupportedFormats.RSS_14, "DataBar"],
            [Html5QrcodeSupportedFormats.RSS_EXPANDED, "DataBarExpanded"],
            [Html5QrcodeSupportedFormats.UPC_A, "UPC-A"],
            [Html5QrcodeSupportedFormats.UPC_E, "UPC-E"],
            [Html5QrcodeSupportedFormats.DATABAR_LIMITED, "DataBarLimited" ],
            [Html5QrcodeSupportedFormats.DX_FILM_EDGE, "DXFilmEdge" ],
            [Html5QrcodeSupportedFormats.MICRO_QR_CODE, "MicroQRCode" ],
            [Html5QrcodeSupportedFormats.RMQR_CODE, "rMQRCode" ],
        ]);
    private readonly reverseFormatMap: Map<any, Html5QrcodeSupportedFormats>
        = this.createReverseFormatMap();

    private readerOptions: ZXing_wasm.ReaderOptions;
    private verbose: boolean;
    private logger: Logger;

    public constructor(
        requestedFormats: Array<Html5QrcodeSupportedFormats>,
        verbose: boolean,
        logger: Logger) {
        if (!ZXing_wasm) {
            throw "Use html5qrcode.min.js without edit, ZXing not found.";
        }
        this.verbose = verbose;
        this.logger = logger;

        const formats = this.createZXingFormats(requestedFormats);
        this.readerOptions = {
            ...defaultReaderOptions,
            formats: formats
        }
    }


    decodeAsync(canvas: HTMLCanvasElement): Promise<QrcodeResult> {
        return this.decode(canvas);
    }

    private async decode(canvas: HTMLCanvasElement): Promise<QrcodeResult> {
        let context = canvas.getContext("2d")
        if (!context) {
            throw 'The canvas 2d context is broken'
        }
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        let result = await ZXing_wasm.readBarcodesFromImageData(imageData)
        // This is an array, we just take the first element
        return {
            text: result[0].text,
            format: QrcodeResultFormat.create(
                this.toHtml5QrcodeSupportedFormats(result[0].format)),
                debugData: this.createDebugData()
        };
    }

    private createReverseFormatMap(): Map<any, Html5QrcodeSupportedFormats> {
        let result = new Map();
        this.formatMap.forEach(
            (value: any, key: Html5QrcodeSupportedFormats, _) => {
            result.set(value, key);
        });
        return result;
    }

    private toHtml5QrcodeSupportedFormats(zxingFormat: any)
        : Html5QrcodeSupportedFormats {
        if (!this.reverseFormatMap.has(zxingFormat)) {
            throw `reverseFormatMap doesn't have ${zxingFormat}`;
        }
        return this.reverseFormatMap.get(zxingFormat)!;
    }

    private createZXingFormats(
        requestedFormats: Array<Html5QrcodeSupportedFormats>):
        Array<any> {
            let zxingFormats = [];
            for (const requestedFormat of requestedFormats) {
                if (this.formatMap.has(requestedFormat)) {
                    zxingFormats.push(
                        this.formatMap.get(requestedFormat));
                } else {
                    this.logger.logError(`${requestedFormat} is not supported by`
                        + "ZXingHtml5QrcodeShim");
                }
            }
            return zxingFormats;
    }

    private createDebugData(): QrcodeResultDebugData {
        return { decoderName: "zxing-js" };
    }
}
