import { ethers } from "ethers";
import { getAddresses } from "../../constants";
import {
  TrimTokenContract,
  MimTokenContract,
  PresaleContract,
} from "../../abi";
import {
  clearPendingTxn,
  fetchPendingTxns,
  getPresaleTypeText,
} from "./pending-txns-slice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountSuccess, getBalances } from "./account-slice";
import { loadAppDetails } from "./app-slice";
import {
  JsonRpcProvider,
  StaticJsonRpcProvider,
} from "@ethersproject/providers";
import { Networks } from "../../constants/blockchain";
import {
  warning,
  success,
  info,
  error,
} from "../../store/slices/messages-slice";
import { messages } from "../../constants/messages";
import { getGasPrice } from "../../helpers/get-gas-price";
import { metamaskErrorWrap } from "../../helpers/metamask-error-wrap";
import { sleep } from "../../helpers";
import { waitForDebugger } from "inspector";

interface IChangeApproval {
  token: string;
  provider: StaticJsonRpcProvider | JsonRpcProvider;
  address: string;
  networkID: Networks;
}

export const changeApproval = createAsyncThunk(
  "presale/changeApproval",
  async (
    { token, provider, address, networkID }: IChangeApproval,
    { dispatch }
  ) => {
    if (!provider) {
      dispatch(warning({ text: messages.please_connect_wallet }));
      return;
    }
    const addresses = getAddresses(networkID);

    const signer = provider.getSigner();
    const trimContract = new ethers.Contract(
      addresses.TRIM_ADDRESS,
      TrimTokenContract,
      signer
    );
    const mimContract = new ethers.Contract(
      addresses.MIM_ADDRESS,
      MimTokenContract,
      signer
    );

    let approveTx;
    try {
      const gasPrice = await getGasPrice(provider);

      if (token === "trim") {
        approveTx = await trimContract.approve(
          addresses.PRESALE_ADDRESS,
          ethers.constants.MaxUint256,
          { gasPrice }
        );
      }

      if (token === "mim") {
        approveTx = await mimContract.approve(
          addresses.PRESALE_ADDRESS,
          ethers.constants.MaxUint256,
          { gasPrice }
        );
      }

      const text = "Approve " + (token === "mim" ? "Purchasing" : "Claiming");
      const pendingTxnType =
        token === "mim" ? "approve_purchasing" : "approve_Claiming";

      dispatch(
        fetchPendingTxns({
          txnHash: approveTx.hash,
          text,
          type: pendingTxnType,
        })
      );
      await approveTx.wait();
      dispatch(success({ text: messages.tx_successfully_send }));
    } catch (err: any) {
      return metamaskErrorWrap(err, dispatch);
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    await sleep(2);

    const purchaseAllowance = await mimContract.allowance(
      address,
      addresses.PRESALE_ADDRESS
    );
    const claimAllowance = await trimContract.allowance(
      address,
      addresses.PRESALE_ADDRESS
    );

    return dispatch(
      fetchAccountSuccess({
        presale: {
          mim: Number(purchaseAllowance),
          trim: Number(claimAllowance),
        },
      })
    );
  }
);

interface IChangeBuy {
  action: string;
  value: string;
  provider: StaticJsonRpcProvider | JsonRpcProvider;
  address: string;
  networkID: Networks;
}

export const changePresale = createAsyncThunk(
  "presale/changePresale",
  async (
    { action, value, provider, address, networkID }: IChangeBuy,
    { dispatch }
  ) => {
    if (!provider) {
      dispatch(warning({ text: messages.please_connect_wallet }));
      return;
    }
    const addresses = getAddresses(networkID);
    const signer = provider.getSigner();
    const presale = new ethers.Contract(
      addresses.PRESALE_ADDRESS,
      PresaleContract,
      signer
    );

    let presaleTx;

    try {
      const gasPrice = await getGasPrice(provider);

      if (action === "purchase") {
        presaleTx = await presale.deposit(ethers.utils.parseEther(value), {
          gasPrice,
        });
      } else {
        presaleTx = await presale.claim({ gasPrice });
      }
      const pendingTxnType = action === "purchase" ? "purchasing" : "claiming";
      dispatch(
        fetchPendingTxns({
          txnHash: presaleTx.hash,
          text: getPresaleTypeText(action),
          type: pendingTxnType,
        })
      );
      await presaleTx.wait();
      dispatch(success({ text: messages.tx_successfully_send }));
    } catch (err: any) {
      return metamaskErrorWrap(err, dispatch);
    } finally {
      if (presaleTx) {
        dispatch(clearPendingTxn(presaleTx.hash));
      }
    }
    dispatch(info({ text: messages.your_balance_update_soon }));
    await sleep(10);
    await dispatch(getBalances({ address, networkID, provider }));
    await dispatch(loadAppDetails({ networkID, provider }));
    dispatch(info({ text: messages.your_balance_updated }));
    return;
  }
);
