// const ColorContrastChecker = requires("./colorContrastChecker")
let countNonValid = 0;
let countTotal = 0;
let toggle = false;
// let body = document.getElementsByTagName("body")[0];
const originalBody = document.body.cloneNode(true);

var xml = new XMLSerializer().serializeToString(originalBody);


chrome.storage.local.set({originalBody: xml }).then(() => {
  });
  

// console.log(originalBody);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log('content listener')
    if (message.action === "accessabilityToggle") {
    //   document.body.style.backgroundColor = message.color;
    analyzeAccessibility()
      sendResponse({ status: "Color changed to " + message.color });
    }
  });

async function analyzeAccessibility() {

    countNonValid = 0;
    countTotal = 0;

    if(toggle) {
        
        chrome.storage.local.get(["originalBody"]).then((result) => {
            var restoredDoc = new DOMParser().parseFromString(result.originalBody, "text/xml");


            // console.log(result.originalBody);
            // console.log(result + "result");
            // console.log(JSON.stringify(result) + "result stringify");
            console.log(restoredDoc + "restored doc");
            // console.log(restoredDoc.toString() +"to string");

            document=restoredDoc;
          });

        

        console.log(document.body);
        console.log(originalBody);
    } else {
        const body = document.body;
        let parentBackgroundColor = getComputedStyle(body).backgroundColor; 
        await scrapeForColors(body, originalBody, parentBackgroundColor);
        console.log(document.body);
        console.log(originalBody);
    }

    // countNonValid=0;
    // countTotal=0;

    // parentBackgroundColor = getComputedStyle(body).backgroundColor; 
    // await scrapeForColors(body, parentBackgroundColor);

    if(toggle) {
        alert((countNonValid/countTotal)*100+"% of the elements on this webpage are not valid by the WCAG standards. After clicking 'ok', the page will reset to its initial state.");
        toggle=false;
    } else {
        alert("Initially "+(countNonValid/countTotal)*100+"% of the elements on this webpage were not valid by the WCAG standards. After clicking 'ok', all of the elements on the page will meet the WCAG criteria.");
        toggle=true;
    }

    // console.log(countNonValid);
    // console.log(countTotal);
    // console.log(countNonValid/countTotal);
    
}

function contrastChecker({backgroundColor,fontColor,fontSize}) {
    const ccc = new ColorContrastChecker();

    let worked = true;
    if (ccc.isLevelAA(backgroundColor, fontColor, parseInt(fontSize))&&(fontSize>=10)) {
        // console.log("The color contrast is valid for Level AA");
    } else {
        // console.log("The color contrast is INVALID");
        worked = false;
    }
    return worked;
}

function rgbToHex(input) {
    var rgbColor = input.split("(")[1].split(")")[0];
    rgbColor = rgbColor.split(",");
    var b = rgbColor.map(function (x) { //For each array element
        x = parseInt(x).toString(16); //Convert to a base16 string
        return (x.length == 1) ? "0" + x : x; //Add zero if we get only one character
    })
    var color = "#" + b.join("");
    return color.substring(0,7);
}

async function sendColors(backgroundColor, elementColor, fontSize) {
    const validContrast = contrastChecker({
        backgroundColor: backgroundColor,
        fontColor: elementColor,
        fontSize: fontSize
    })
    return validContrast;
};

function getChildText(element) {
    let text = '';
    for (let child of element.childNodes) {
        if(child.nodeType === Node.TEXT_NODE) {
          text += child.textContent.trim(); // Get only text nodes and trim whitespace
        }
    }
    return text;
}

async function scrapeForColors(element, ogElement, parentBackgroundColor) {
    for(let i=0; i<element.children.length; i++) {
        // console.log(getChildText(element.children[i]));
        // console.log(element);
        // console.log(element.children[i]);
        // console.log(element.children[i].tagName);
        // console.log(element.children[i]);
        // console.log(element.children[i].children);
        // console.log(element.children[i]);
        // console.log(ogElement.children[i]);
        // if(element.children[i].tagName=="script"||ogElement.children[i].tagName=="script") {
        //     break;
        // }
        // if(!(getChildText(element.children[i])=="")) {
            var rgbBackgroundColor = getComputedStyle(element.children[i]).backgroundColor;
            if (rgbBackgroundColor == "rgba(0, 0, 0, 0)") {
                rgbBackgroundColor = parentBackgroundColor;
            }
        
            var backgroundColor = rgbToHex(rgbBackgroundColor);
    
            const rgbElementColor = getComputedStyle(element.children[i]).color;
    
            const fontSizeBefore = getComputedStyle(element.children[i]).fontSize;
    
            // console.log(rgbElementColor);
            const fontSize = fontSizeBefore.split('p')[0];
    
            // console.log(fontSize);
    
            var elementColor = rgbToHex(rgbElementColor);
    
            var valid = await sendColors(backgroundColor, elementColor, fontSize);
    
            if(!toggle) {
                if(!valid.worked) {
                    countNonValid++;
                    element.children[i].style.backgroundColor="white";
                    element.children[i].style.color="black";
                    element.children[i].style.fontSize="18px";
                }
            } else {
                element.children[i].style.backgroundColor=ogElement.children[i].style.backgroundColor;
                element.children[i].style.color=ogElement.children[i].style.color;
                element.children[i].style.fontSize=ogElement.children[i].style.fontSize;
            }
        // }
        // console.log(valid);

        countTotal++;

        // if((element?.children[i].children.length!=0)&&(ogElement?.children[i].children.length!=0)) { 
            await scrapeForColors(element?.children[i],ogElement?.children[i],rgbBackgroundColor);
        // }
    }
}

function ColorContrastChecker() {};


ColorContrastChecker.prototype = {
    fontSize: 14,
    rgbClass : {
        toString: function() {
            return "<r: " + this.r +
                " g: " + this.g +
                " b: " + this.b +
                " >";
        }
    },
    isValidSixDigitColorCode: function (hex){
        var regSixDigitColorcode = /^(#)?([0-9a-fA-F]{6})?$/;
        return regSixDigitColorcode.test(hex);
    },
    isValidThreeDigitColorCode: function (hex){
        var regThreeDigitColorcode = /^(#)?([0-9a-fA-F]{3})?$/;
        return regThreeDigitColorcode.test(hex);
    },
    isValidColorCode : function (hex){
        return this.isValidSixDigitColorCode(hex) || this.isValidThreeDigitColorCode(hex);
    },
    isValidRatio : function (ratio){
        return (typeof ratio === "number");
    },
    convertColorToSixDigit: function (hex) {
        return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    },
    hexToLuminance: function (color) {
        if (!this.isValidColorCode(color)) {
            throw new Error("Invalid Color :" + color);
        }

        if (this.isValidThreeDigitColorCode(color)) {
            color = this.convertColorToSixDigit(color);
        }

        color = this.getRGBFromHex(color);

        var LRGB = this.calculateLRGB(color);

        return this.calculateLuminance(LRGB);
    },
    check: function (colorA, colorB, fontSize, customRatio) {
        if (typeof fontSize !== "undefined") {
            this.fontSize = fontSize;
        }

        if(!colorA || !colorB) {
            return false;
        }

        var l1 = this.hexToLuminance(colorA); /* higher value */
        var l2 = this.hexToLuminance(colorB); /* lower value */
        var contrastRatio = this.getContrastRatio(l1, l2);

        if (typeof customRatio !== "undefined") {
            if (!this.isValidRatio(customRatio)) {
                return false;
            }
            return this.verifyCustomContrastRatio(contrastRatio, customRatio);
        } else {
            return this.verifyContrastRatio(contrastRatio);
        }   
    },
    checkPairs: function (pairs, customRatio) {
        var results = [];

        for (var i in pairs) {
            var pair = pairs[i];
            if (typeof pair.fontSize !== "undefined") {
                results.push(
                    this.check(
                        pair.colorA,
                        pair.colorB,
                        pair.fontSize,
                        customRatio
                    )
                );
            } else {
                results.push(
                    this.check(
                        pair.colorA,
                        pair.colorB,
                        void 0,
                        customRatio
                    )
                );
            }
        }
        return results;
    },
    calculateLuminance: function(lRGB) {
        return (0.2126 * lRGB.r) + (0.7152 * lRGB.g) + (0.0722 * lRGB.b);
    },
    isLevelAA : function(colorA, colorB, fontSize) {
        var result = this.check(colorA, colorB, fontSize);
        return result.WCAG_AA;
    },
    isLevelAAA : function(colorA, colorB, fontSize) {
        var result = this.check(colorA, colorB, fontSize);
        return result.WCAG_AAA; 
    },
    isLevelCustom : function(colorA, colorB, ratio) {
        var result = this.check(colorA, colorB, void 0, ratio);
        return result.customRatio;
    },
    getRGBFromHex : function(color) {

        var rgb = Object.create(this.rgbClass),
            rVal,
            gVal,
            bVal;

        if (typeof color !== "string") {
            throw new Error("must use string");
        }

        rVal = parseInt(color.slice(1, 3), 16);
        gVal = parseInt(color.slice(3, 5), 16);
        bVal = parseInt(color.slice(5, 7), 16);

        rgb.r = rVal;
        rgb.g = gVal;
        rgb.b = bVal;

        return rgb;
    },
    calculateSRGB : function(rgb) {
        var sRGB = Object.create(this.rgbClass),
            key;

        for (key in rgb) {
            if (rgb.hasOwnProperty(key)) {
                sRGB[key] = parseFloat((rgb[key] / 255), 10);
            }
        }

        return sRGB;
    },
    calculateLRGB: function (rgb) {
        var sRGB = this.calculateSRGB(rgb);
        var lRGB = Object.create(this.rgbClass),
            key,
            val = 0;

        for (key in sRGB) {
            if (sRGB.hasOwnProperty(key)) {
                val = parseFloat(sRGB[key], 10);
                if (val <= 0.03928) {
                    lRGB[key] = (val / 12.92);
                } else {
                    lRGB[key] = Math.pow(((val + 0.055) / 1.055), 2.4);
                }
            }
        }

        return lRGB;
    },
    getContrastRatio : function(lumA, lumB) {
        var ratio,
            lighter,
            darker;

        if (lumA >= lumB) {
            lighter = lumA;
            darker = lumB;
        } else {
            lighter = lumB;
            darker = lumA;
        }

        ratio = (lighter + 0.05) / (darker + 0.05);

        return ratio;
    },
    verifyContrastRatio : function(ratio) {


        var resultsClass = {
            toString: function() {
                return "< WCAG-AA: " + ((this.WCAG_AA) ? "pass" : "fail") +
                    " WCAG-AAA: " + ((this.WCAG_AAA) ? "pass" : "fail") +
                    " >";
            }
        };
        var WCAG_REQ_RATIO_AA_LG = 3.0,
            WCAG_REQ_RATIO_AA_SM = 4.5,
            WCAG_REQ_RATIO_AAA_LG = 4.5,
            WCAG_REQ_RATIO_AAA_SM = 7.0,
            WCAG_FONT_CUTOFF = 18;

        var results = Object.create(resultsClass),
            fontSize = this.fontSize || 14;

        if (fontSize >= WCAG_FONT_CUTOFF) {
            results.WCAG_AA = (ratio >= WCAG_REQ_RATIO_AA_LG);
            results.WCAG_AAA = (ratio >= WCAG_REQ_RATIO_AAA_LG);
        } else {
            results.WCAG_AA = (ratio >= WCAG_REQ_RATIO_AA_SM);
            results.WCAG_AAA = (ratio >= WCAG_REQ_RATIO_AAA_SM);
        }

        return results;
    },
    verifyCustomContrastRatio : function(inputRatio, checkRatio) {

        var resultsClass = {
            toString: function() {
                return "< Custom Ratio: " + ((this.customRatio) ? "pass" : "fail") +
                    "  >";
            }
        };

        var results = Object.create(resultsClass);

        results.customRatio = (inputRatio >= checkRatio);
        return results;
    }

};
// (async ()=>{
  
// })()