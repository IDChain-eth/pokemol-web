import Web3 from 'web3';

import {
  Web3McDaoService,
  Web3McDaoServiceV2,
  ReadonlyMcDaoService,
} from './McDaoService';
import { Web3TokenService, TokenService } from './TokenService';

let singleton;

export const USER_TYPE = {
  WEB3: 'web3',
  READ_ONLY: 'readonly',
};

export class DaoService {
  accountAddr;
  web3;
  mcDao;
  token;
  daoAddress;

  constructor(accountAddr, web3, mcDaoService, token, contractAddr) {
    this.accountAddr = accountAddr;
    this.web3 = web3;
    this.mcDao = mcDaoService;
    this.token = token;
    this.daoAddress = contractAddr;
  }

  static retrieve() {
    return singleton || undefined;
  }

  static async instantiateWithWeb3(
    accountAddr,
    injected,
    contractAddr,
    version,
  ) {
    const web3 = new Web3(injected);

    let mcDao;
    let approvedToken;
    if (version === 2) {
      mcDao = new Web3McDaoServiceV2(web3, contractAddr, accountAddr, version);
      approvedToken = await mcDao.getDepositToken();
    } else {
      mcDao = new Web3McDaoService(web3, contractAddr, accountAddr, version);
      approvedToken = await mcDao.approvedToken();
    }

    const token = new Web3TokenService(
      web3,
      approvedToken,
      contractAddr,
      accountAddr,
    );

    singleton = new Web3DaoService(accountAddr, web3, mcDao, token);
    return singleton;
  }

  static async instantiateWithReadOnly(contractAddr, version) {
    const web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.REACT_APP_INFURA_URI),
    );

    const mcDao = new ReadonlyMcDaoService(web3, contractAddr, '', version);

    let approvedToken;
    if (version === 2) {
      approvedToken = await mcDao.getDepositToken();
    } else {
      approvedToken = await mcDao.approvedToken();
    }
    const token = new TokenService(web3, approvedToken);
    singleton = new ReadonlyDaoService('', web3, mcDao, token, contractAddr);
    return singleton;
  }

  async getAccountEth() {
    const wei = await this.getAccountWei();
    return this.web3.utils.fromWei(wei);
  }
}

export class ReadonlyDaoService extends DaoService {
  userType = USER_TYPE.READ_ONLY;

  async getAccountWei() {
    return '0';
  }
}

export class Web3DaoService extends DaoService {
  userType = USER_TYPE.WEB3;

  async getAccountWei() {
    const ethWei = await this.web3.eth.getBalance(this.accountAddr);
    return ethWei;
  }
}
