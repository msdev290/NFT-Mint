import AvaxIcon from "../assets/tokens/AVAX.svg";
import MimIcon from "../assets/tokens/MIM.svg";
import TrimIcon from "../assets/tokens/TRIM.png";

export interface IToken {
    name: string;
    address: string;
    img: string;
    isAvax?: boolean;
    decimals: number;
}

export const avax: IToken = {
    name: "AVAX",
    isAvax: true,
    img: AvaxIcon,
    address: "",
    decimals: 18,
};

export const mim: IToken = {
    name: "MIM",
    address: "0x125f2b48Db450De962de6EFe9f75DAF1D4281159",
    img: MimIcon,
    decimals: 18,
};

const trim: IToken = {
    name: "TRIM",
    address: "0x9310Ab15b7C4959e1cedEe1142b2eFF1b767500e",
    img: TrimIcon,
    decimals: 9,
};

export default [avax, mim, trim];
