// got from https://www.mathsisfun.com/binary-decimal-hexadecimal-converter.html

class Num {

    constructor(s, base) {
        s = typeof s !== 'undefined' ? s : '';
        base = typeof base !== 'undefined' ? base : 10;
        this.sign = 1;
        this.digits = "";
        this.dec = 0;
        this.MAXDEC = 20;
        this.baseDigits = "0123456789ABCDEFGHJKLMNP";
        this.setNum(s, base);
    }

    setNum(s, base) {
        base = typeof base !== 'undefined' ? base : 10;
        if (s == 0) {
            this.digits = '0';
            return;
        }
        if (base == 10) {
            var digits = s;
            if (digits.charAt(0) == "-") {
                this.sign = -1;
                digits = digits.substring(1);
            } else {
                this.sign = 1;
            }
            var eVal = 0;
            var ePos = digits.indexOf("e");
            if (ePos >= 0) {
                eVal = (digits.substr(ePos + 1)) >> 0;
                digits = digits.substr(0, ePos);
            }
            this.dec = digits.length - (digits.indexOf(".") + 1);
            if (this.dec == digits.length) {
                this.dec = 0;
            }
            this.dec -= eVal;
            digits = digits.split(".").join("");
            digits = digits.replace(/^0+/, '');
            if (digits.length == 0) {
                this.sign = 1;
            } else {
                var s1 = "";
                for (var i = 0; i < digits.length; i++) {
                    var digit = digits.charAt(i);
                    if (this.baseDigits.indexOf(digit) >= 0) {
                        s1 += digit;
                    }
                }
                digits = s1;
            }
            this.digits = digits;
        } else {
            this.setFromBase(s, base);
        }
    }

    setFromBase(numStr, base) {
        var srcSign = "";
        if (numStr.charAt(0) == "-") {
            srcSign = "-";
            numStr = numStr.substring(1);
        }
        var baseDec = numStr.length - (numStr.indexOf(".") + 1);
        if (baseDec == numStr.length) {
            baseDec = 0;
        }
        numStr = numStr.split(".").join("");
        numStr = numStr.replace(/^0+/, '');
        if (numStr.length == 0) {
            this.setNum("0");
        } else {
            var i = 0;
            var len = numStr.length;
            var baseStr = base.toString();
            var digit = this.baseDigits.indexOf(numStr.charAt(i++).toUpperCase()).toString();
            var result = digit;
            while (i < len) {
                digit = this.baseDigits.indexOf(numStr.charAt(i++).toUpperCase()).toString();
                result = this.fullMultiply(result, baseStr);
                result = this.fullAdd(result, digit);
            }
            if (baseDec > 0) {
                var divBy = this.fullPower(baseStr, baseDec);
                result = this.fullDivide(result, divBy, this.MAXDEC);
            }
            this.setNum(srcSign + result);
        }
    }

    toBase(base, places) {
        var parts = this.splitWholeFrac();
        var s = this.fullBaseWhole(parts[0], base);
        if (parts[1].length > 0) {
            s += "." + this.fullBaseFrac(parts[1], base, places);
        }
        if (this.sign == -1) {
            if (s != "0") {
                s = "-" + s;
            }
        }
        return s;
    }

    mult10(n) {
        var xNew = this.clone();
        xNew.dec = xNew.dec - n;
        if (xNew.dec < 0) {
            xNew.digits = xNew.digits + "0".repeat(-xNew.dec);
            xNew.dec = 0;
        }
        return xNew;
    }

    clone() {
        var ansNum = new Num();
        ansNum.digits = this.digits;
        ansNum.dec = this.dec;
        ansNum.sign = this.sign;
        return ansNum;
    }

    fullMultiply(x, y) {
        return this.multNums(new Num(x), new Num(y)).fmt();
    }

    multNums(xNum, yNum) {
        var N1 = xNum.digits;
        var N2 = yNum.digits;
        var ans = "0";
        for (var i = N1.length - 1; i >= 0; i--) {
            ans = this.fullAdd(ans, (this.fullMultiply1(N2, N1.charAt(i)) + "0".repeat(N1.length - i - 1)));
        }
        var ansNum = new Num(ans);
        ansNum.dec = xNum.dec + yNum.dec;
        ansNum.sign = xNum.sign * yNum.sign;
        return ansNum;
    }

    fullMultiply1(x, y1) {
        var carry = "0";
        var ans = "";
        for (var i = x.length - 1; i > (-1); i--) {
            var product = ((x.charAt(i)) >> 0) * (y1 >> 0) + (carry >> 0);
            var prodStr = product.toString();
            if (product < 10) {
                prodStr = "0" + prodStr;
            }
            carry = prodStr.charAt(0);
            ans = prodStr.charAt(1) + ans;
        }
        if (carry != "0") {
            ans = carry + ans;
        }
        return ans;
    }

    fullAdd(x, y) {
        return this.addNums(new Num(x), new Num(y)).fmt();
    }

    addNums(xNum, yNum) {
        var ansNum = new Num();
        if (xNum.sign * yNum.sign == -1) {
            ansNum = this.subNums(xNum.abs(), yNum.abs());
            if (xNum.sign == -1) {
                ansNum.sign *= -1;
            }
            return ansNum;
        }
        var maxdec = Math.max(xNum.dec, yNum.dec);
        var xdig = xNum.digits + "0".repeat(maxdec - xNum.dec);
        var ydig = yNum.digits + "0".repeat(maxdec - yNum.dec);
        var maxlen = Math.max(xdig.length, ydig.length);
        xdig = "0".repeat(maxlen - xdig.length) + xdig;
        ydig = "0".repeat(maxlen - ydig.length) + ydig;
        var ans = "";
        var carry = 0;
        for (var i = xdig.length - 1; i >= 0; i--) {
            var temp = ((xdig.charAt(i)) >> 0) + ((ydig.charAt(i)) >> 0) + carry;
            if ((temp >= 0) && (temp < 20)) {
                if (temp > 9) {
                    carry = 1;
                    ans = temp - 10 + ans;
                } else {
                    carry = 0;
                    ans = temp + ans;
                }
            }
        }
        if (carry == 1) {
            ans = "1" + ans;
        }
        ansNum.setNum(ans);
        ansNum.sign = xNum.sign;
        ansNum.dec = maxdec;
        return ansNum;
    }

    fullPower(x, n) {
        return this.expNums(new Num(x), n).fmt();
    }

    expNums(xNum, nInt) {
        var n = nInt;
        var b2pow = 0;
        while ((n & 1) == 0) {
            b2pow++;
            n >>= 1;
        }
        var x = xNum.digits;
        var r = x;
        while ((n >>= 1) > 0) {
            x = this.fullMultiply(x, x);
            if ((n & 1) != 0) {
                r = this.fullMultiply(r, x);
            }
        }
        while (b2pow-- > 0) {
            r = this.fullMultiply(r, r);
        }
        var ansNum = new Num(r);
        ansNum.dec = xNum.dec * nInt;
        return ansNum;
    }

    div(num, decimals) {
        return this.divNums(this, num, decimals);
    }

    fullDivide(x, y, decimals) {
        return this.divNums(new Num(x), new Num(y), decimals).fmt();
    }

    divNums(xNum, yNum, decimals) {
        decimals = typeof decimals !== 'undefined' ? decimals : this.MAXDEC;
        if (xNum.digits.length == 0) {
            return new Num("0");
        }
        if (yNum.digits.length == 0) {
            return new Num("0");
        }
        var xDec = xNum.mult10(decimals);
        var maxdec = Math.max(xDec.dec, yNum.dec);
        var xdig = xDec.digits + "0".repeat(maxdec - xDec.dec);
        var ydig = yNum.digits + "0".repeat(maxdec - yNum.dec);
        if (this.compareDigits(xdig, "0") == 0) {
            return new Num("0");
        }
        if (this.compareDigits(ydig, "0") == 0) {
            return new Num("0");
        }
        var timestable = new Array(10);
        for (var i = 0; i < 10; i++) {
            timestable[i] = this.fullMultiply(ydig, i.toString());
        }
        var ans = "0";
        var xNew = xdig;
        while (this.compareDigits(xNew, ydig) >= 0) {
            var col = 1;
            while (this.compareDigits(xNew.substring(0, col), ydig) < 0) {
                col++;
            }
            var xCurr = xNew.substring(0, col);
            var mult = 9;
            while (this.compareDigits(timestable[mult], xCurr) > 0) {
                mult--;
            }
            var fullmult = mult + "" + "0".repeat(xNew.length - xCurr.length);
            ans = this.fullAdd(ans, fullmult);
            xNew = this.fullSubtract(xNew, this.fullMultiply(ydig, fullmult));
        }
        var ansNum = new Num(ans);
        ansNum.dec = decimals;
        ansNum.sign = xNum.sign * yNum.sign;
        return ansNum;
    }

    sub(num) {
        return this.subNums(this, num);
    }

    fullSubtract(x, y) {
        return this.subNums(new Num(x), new Num(y)).fmt();
    }

    subNums(xNum, yNum) {
        var ansNum = new Num();
        if (xNum.sign * yNum.sign == -1) {
            ansNum = xNum.abs().add(yNum.abs());
            if (xNum.sign == -1) {
                ansNum.sign *= -1;
            }
            return ansNum;
        }
        var maxdec = Math.max(xNum.dec, yNum.dec);
        var xdig = xNum.digits + "0".repeat(maxdec - xNum.dec);
        var ydig = yNum.digits + "0".repeat(maxdec - yNum.dec);
        var maxlen = Math.max(xdig.length, ydig.length);
        xdig = "0".repeat(maxlen - xdig.length) + xdig;
        ydig = "0".repeat(maxlen - ydig.length) + ydig;
        var sign = this.compareDigits(xdig, ydig);
        if (sign == 0) {
            return new Num("0");
        }
        if (sign == -1) {
            var temp = xdig;
            xdig = ydig;
            ydig = temp;
        }
        var ans = "";
        var isborrow = 0;
        for (var i = xdig.length - 1; i >= 0; i--) {
            var xPiece = (xdig.charAt(i)) >> 0;
            var yPiece = (ydig.charAt(i)) >> 0;
            if (isborrow == 1) {
                isborrow = 0;
                xPiece = xPiece - 1;
            }
            if (xPiece < 0) {
                xPiece = 9;
                isborrow = 1;
            }
            if (xPiece < yPiece) {
                xPiece = xPiece + 10;
                isborrow = 1;
            }
            ans = (xPiece - yPiece) + ans;
        }
        ansNum.setNum(ans);
        ansNum.sign = sign * xNum.sign;
        ansNum.dec = maxdec;
        return ansNum;
    }

    fmt(sigDigits, eStt) {
        sigDigits = typeof sigDigits !== 'undefined' ? sigDigits : 0;
        eStt = typeof eStt !== 'undefined' ? eStt : 0;
        var decWas = this.dec;
        var digitsWas = this.digits;
        if (sigDigits > this.digits.length) {
            this.dec += sigDigits - this.digits.length;
            this.digits += strRepeat("0", sigDigits - this.digits.length);
        }
        var s = this.digits;
        var decpos = s.length - this.dec;
        var eVal = decpos - 1;
        if (eStt > 0 && Math.abs(eVal) >= eStt) {
            var s1 = s.substr(0, 1) + "." + s.substr(1);
            s1 = s1.replace(/0+$/, '');
            if (s1.charAt(s1.length - 1) == ".") {
                s1 = s1.substr(0, s1.length - 1);
            }
            if (eVal > 0) {
                s = s1 + "e+" + eVal;
            } else {
                s = s1 + "e" + eVal;
            }
        } else {
            if (decpos < 0) {
                s = "0." + "0".repeat(-decpos) + s;
            } else if (decpos == 0) {
                s = "0." + s;
            } else if (decpos > 0) {
                if (this.dec >= 0) {
                    s = s.substr(0, decpos) + "." + s.substr(decpos, this.dec);
                } else {
                    s = s + "0".repeat(-this.dec) + ".";
                }
            }
            if (s.charAt(s.length - 1) == ".") {
                s = s.substring(0, s.length - 1);
            }
        }
        if (this.sign == -1) {
            if (s != "0") {
                s = "-" + s;
            }
        }
        this.dec = decWas;
        this.digits = digitsWas;
        return s;
    }

    compareDigits(x, y) {
        if (x.length > y.length) {
            return 1;
        }
        if (x.length < y.length) {
            return -1;
        }
        for (var i = 0; i < x.length; i++) {
            if (x.charAt(i) < y.charAt(i)) {
                return -1;
            }
            if (x.charAt(i) > y.charAt(i)) {
                return 1;
            }
        }
        return 0;
    }

    splitWholeFrac() {
        var s = this.digits;
        var decpos = s.length - this.dec;
        if (decpos < 0) {
            s = "0".repeat(-decpos) + s;
            decpos = 0;
        }
        if (this.dec < 0) {
            s = s + "0".repeat(-this.dec) + ".";
        }
        var wholePart = s.substr(0, decpos);
        var fracPart = s.substr(decpos);
        if (fracPart.replace(/^0+/, '').length == 0) {
            fracPart = "";
        } else {
            fracPart = "0." + fracPart;
        }
        return [wholePart, fracPart];
    }

    fullBaseWhole(d, base) {
        var baseStr = base.toString();
        var dWhole = this.fullDivide(d, baseStr, 0);
        var dRem = this.fullSubtract(d, this.fullMultiply(dWhole, baseStr));
        if (dWhole == "0") {
            return this.baseDigits.charAt(dRem >> 0);
        } else {
            return this.fullBaseWhole(dWhole, base) + this.baseDigits.charAt(dRem >> 0);
        }
    }

    fullBaseFrac(d, base, places, level) {
        level = typeof level !== 'undefined' ? level : 0;
        var r = this.fullMultiply(d, base.toString());
        var parts = r.split(".");
        var wholePart = parts[0];
        if (parts.length == 1 || level >= places - 1) {
            return this.baseDigits.charAt(wholePart >> 0);
        } else {
            var fracPart = "0." + parts[1];
            return this.baseDigits.charAt(wholePart >> 0) + this.fullBaseFrac(fracPart, base, places, level + 1);
        }
    }

    getSignStr() {
        if (this.sign == -1) {
            return "-";
        } else {
            return "";
        }
    }

    getWholeStr() {
        var s = this.digits;
        var decpos = s.length - this.dec;
        if (decpos < 0) {
            s = "0".repeat(-decpos) + s;
            decpos = 0;
        }
        if (this.dec < 0) {
            s = s + "0".repeat(-this.dec) + ".";
        }
        return s.substr(0, decpos);
    }

    getDecStr() {
        var s = this.digits;
        var decpos = s.length - this.dec;
        if (decpos < 0) {
            s = "0".repeat(-decpos) + s;
            decpos = 0;
        }
        if (this.dec < 0) {
            s = s + "0".repeat(-this.dec) + ".";
        }
        return s.substr(decpos);
    };
}

module.exports = Num;
