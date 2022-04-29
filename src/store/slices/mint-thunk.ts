import { BigNumber, ethers } from "ethers";
import { getAddresses } from "../../constants";
import { NftContract } from "../../abi";
import { clearPendingTxn, fetchPendingTxns, getMintTypeText } from "./pending-txns-slice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { loadAccountDetails } from "./account-slice";
import { loadAppDetails } from "./app-slice";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { Networks } from "../../constants/blockchain";
import { warning, success, info, error } from "../../store/slices/messages-slice";
import { messages } from "../../constants/messages";
import { getGasPrice } from "../../helpers/get-gas-price";
import { metamaskErrorWrap } from "../../helpers/metamask-error-wrap";
import { sleep } from "../../helpers";
import { waitForDebugger } from "inspector";

export interface ITrait {
    name: string;
    png: string;
}

interface IChangeMint {
    count: number;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
    address: string;
    networkID: Networks;
}

export const changeMint = createAsyncThunk("mint/changeMint", async ({ count, provider, address, networkID }: IChangeMint, { dispatch }) => {
    if (!provider) {
        dispatch(warning({ text: messages.please_connect_wallet }));
        return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const NFTContract = new ethers.Contract(addresses.NFT_ADDRESS, NftContract, signer);
    const NFTPrice = await NFTContract.apePrice();
    console.log(NFTPrice);
    let mintTx;
    try {
        const gasPrice = await getGasPrice(provider);
        mintTx = await NFTContract.mintApe(count, {value:NFTPrice.mul(count), gasPrice });
        const pendingTxnType = "minting";
        dispatch(
            fetchPendingTxns({
              txnHash: mintTx.hash,
              text: getMintTypeText(),
              type: pendingTxnType,
            })
          );
          await mintTx.wait();
          dispatch(success({ text: messages.tx_successfully_send }));
    } catch (err: any) {
        return metamaskErrorWrap(err, dispatch);
    } finally {
        if (mintTx) {
            dispatch(clearPendingTxn(mintTx.hash));
        }
    }
    dispatch(info({ text: messages.your_nft_mint_soon }));
    await sleep(15);
    dispatch(info({ text: messages.your_nft_successfully_minted }));
    await dispatch(loadAppDetails({ networkID, provider }));
    await dispatch(loadAccountDetails({ networkID, provider, address }));
    return;
});
