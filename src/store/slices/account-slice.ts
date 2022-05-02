import { BigNumber, ethers } from "ethers";
import { getAddresses } from "../../constants";
import { NftContract } from "../../abi";
import { setAll } from "../../helpers";

import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { JsonRpcProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { fetchNft, clearNfts } from "./nfts-slice";
import { Networks } from "../../constants/blockchain";
import React from "react";
import { RootState } from "../store";
import { IToken } from "../../helpers/tokens";
import axios from "axios";

interface IGetBalances {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

export interface IAvatarDetail {
    id: BigNumber;
    head: BigNumber;
    body: BigNumber;
    leg: BigNumber;
}

interface IAccountBalances {
    balances: {
        avax: string;
        avatarBalance: number;
    };
}

export const getBalances = createAsyncThunk("account/getBalances", async ({ address, networkID, provider }: IGetBalances, { dispatch }): Promise<IAccountBalances> => {
    const addresses = getAddresses(networkID);
    const avaxBalance = await provider.getBalance(address);
    const avatarContract = new ethers.Contract(addresses.NFT_ADDRESS, NftContract, provider);
    const avatarBalance = await avatarContract.balanceOf(address);

    return {
        balances: {
            avax: ethers.utils.formatEther(avaxBalance),
            avatarBalance: Number(avatarBalance),
        },
    };
});

interface ILoadAccountDetails {
    address: string;
    networkID: Networks;
    provider: StaticJsonRpcProvider | JsonRpcProvider;
}

interface IUserAccountDetails {
    balances: {
        avatarBalance: number;
    };
}

export const loadAccountDetails = createAsyncThunk("account/loadAccountDetails", async ({ networkID, provider, address }: ILoadAccountDetails, { dispatch }): Promise<IUserAccountDetails> => {
    
    const addresses = getAddresses(networkID);
    const avatarContract = new ethers.Contract(addresses.NFT_ADDRESS, NftContract, provider);
    const avatarBalance = await avatarContract.balanceOf(address);

    dispatch(clearNfts());

    // const avatars:string[] = await avatarContract.ownedAvatars(address);
    for(var i = 0; i< avatarBalance ; i++) {
        const nftID = await avatarContract.tokenOfOwnerByIndex(address, i);
        const getTokenUri = await avatarContract.tokenURI(nftID);
        const tokendata = await axios.get(getTokenUri);
        dispatch(fetchNft(tokendata.data));
    }
    return {
        balances: {
            avatarBalance: Number(avatarBalance),
        },
    };
});

export interface IAccountSlice {
    loading: boolean;
    balances: {
        avax: string;
        avatarBalance: number;
    };
}

const initialState: IAccountSlice = {
    loading: true,
    balances: { avax: "", avatarBalance: 0, },
};

const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        fetchAccountSuccess(state, action) {
            setAll(state, action.payload);
        },
    },
    extraReducers: builder => {
        builder
            .addCase(loadAccountDetails.pending, state => {
                state.loading = true;
            })
            .addCase(loadAccountDetails.fulfilled, (state, action) => {
                setAll(state, action.payload);
                state.loading = false;
            })
            .addCase(loadAccountDetails.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error);
            })
            .addCase(getBalances.pending, state => {
                state.loading = true;
            })
            .addCase(getBalances.fulfilled, (state, action) => {
                setAll(state, action.payload);
                state.loading = false;
            })
            .addCase(getBalances.rejected, (state, { error }) => {
                state.loading = false;
                console.log(error);
            })
    },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
