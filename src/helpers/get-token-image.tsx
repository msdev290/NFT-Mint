import TrimImg from "../assets/tokens/TRIM.png";

function toUrl(tokenPath: string): string {
    const host = window.location.origin;
    return `${host}/${tokenPath}`;
}

export function getTokenUrl(name: string) {
    if (name === "trim") {
        return toUrl(TrimImg);
    }

    throw Error(`Token url doesn't support: ${name}`);
}
