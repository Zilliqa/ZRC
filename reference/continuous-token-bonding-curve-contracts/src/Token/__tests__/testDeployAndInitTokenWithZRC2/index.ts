import { TestingFunction } from "../../../../scillaTest/utill";
import {
  ByStr20,
  Uint128,
  getDefaultAccount,
  Uint32,
  ScillaString,
  sleep,
  getZil,
} from "../../../../boost-zil";
import * as tokenSDK from "../../build/bind";
import { Long } from "@zilliqa-js/util";
import { zils } from "./../utils";
import { deployFormulaAndOperator } from "./../shared";
import * as zrc2SDK from "./zrc2Bind";

export const testDeployAndInitTokenWithZRC2: TestingFunction = async (
  code,
  ss
) => {
  try {
    console.log("🙌 testDeployAndInitTokenWithZRC2");
    const admin = getDefaultAccount();
    const isolatedServerSecondaryAcc = new ByStr20(
      "0x381f4008505e940AD7681EC3468a719060caF796"
    );
    const adminAddr = new ByStr20(admin.address);
    const limit = Long.fromString("100000");
    const [, , oxygenAddr] = await zrc2SDK
      .deploy(
        adminAddr,
        new ScillaString("Oxygen"),
        new ScillaString("OXY"),
        new Uint32("12"),
        zils("10000")
      )
      .send(limit);
    const oxygen =
      zrc2SDK.hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855(
        oxygenAddr
      );
    const oxygenContract = oxygen.run(limit);
    const { operatorAddr } = await deployFormulaAndOperator(adminAddr);
    const [, , tokenAddr] = await tokenSDK
      .deploy(
        adminAddr,
        new ScillaString("Bancor"),
        new ScillaString("BNT"),
        new Uint32("12"),
        zils("100000"),
        operatorAddr
      )
      .send(limit);
    const token =
      tokenSDK.hash_0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855(
        tokenAddr
      );
    const tokenContract = token.run(limit);
    const connectorBalance = zils("1000");
    await oxygenContract.IncreaseAllowance(tokenAddr, connectorBalance).send();
    await token.state().log("is_init");
    // await oxygen.state().log("balances");
    await tokenContract
      .InitZRC2(new Uint128("2"), connectorBalance, oxygenAddr)
      .send();
    await token.state().log("is_init");
    await token.state().log("balances");
    // await oxygen.state().log("balances");
    //buy smart token
    await oxygenContract.Transfer(tokenAddr, zils("5")).send();
    await token.state().log("balances");
    // await oxygen.state().log("balances");
    //buy smart token transfer from
    await oxygenContract
      .IncreaseAllowance(isolatedServerSecondaryAcc, zils("5"))
      .send();
    await oxygen.state().log("allowances");
    const zil = getZil();
    zil.wallet.setDefault(isolatedServerSecondaryAcc.value);
    await oxygenContract.TransferFrom(adminAddr, tokenAddr, zils("5")).send();
    token.state().log("balances");
    oxygen.state().log("balances");
    //go back to admin
    zil.wallet.setDefault(admin.address);
    //sell smart token
    await tokenContract.Transfer(tokenAddr, zils("2")).send();
    await token.state().log("balances");
    // await oxygen.state().log("balances");
    //sell with transfer from
    await tokenContract
      .IncreaseAllowance(isolatedServerSecondaryAcc, zils("2"))
      .send();
    await token.state().log("allowances");
    zil.wallet.setDefault(isolatedServerSecondaryAcc.value);
    await tokenContract.TransferFrom(adminAddr, tokenAddr, zils("2")).send();
    await token.state().log("allowances");
    await token.state().log("balances");
    await oxygen.state().log("balances");
    //reset zil
    zil.wallet.setDefault(admin.address);
  } catch (e) {
    throw e;
  }
};
