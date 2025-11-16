import { HardhatUserConfig } from "hardhat/config";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatEthersChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";

const config: HardhatUserConfig = {
  solidity: "0.8.28", 
  test: {
    mocha: {}
  },
  paths: {
    sources: "./contracts", 
    tests: { mocha: "./test" },        
    cache: "./cache",
    artifacts: "./artifacts"
  },
  plugins: [hardhatMocha, hardhatEthers, hardhatEthersChaiMatchers],
};

export default config;