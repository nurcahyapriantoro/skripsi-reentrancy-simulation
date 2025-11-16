// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SecureVault {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        balances[msg.sender] = 0; 
        (bool success, bytes memory data) = msg.sender.call{value: amount}("");
        require(success, "Failed to send Ether");
    }
}