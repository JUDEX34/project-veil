// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VaderPKI
 * @dev Decentralized Public Key Infrastructure for mapping a username hash to a Public Key string.
 */
contract VaderPKI {
    // Mapping from bytes32 username hash to Base64 encoded Public Key string
    mapping(bytes32 => string) public pubKeys;

    event PubKeyRegistered(bytes32 indexed usernameHash, string pubKey);

    /**
     * @dev Register a public key for a hashed username. Reverts if already registered.
     * @param _usernameHash The keccak256 hash of the username
     * @param _pubKey The Base64 encoded RSA-OAEP public key
     */
    function registerPubKey(bytes32 _usernameHash, string memory _pubKey) public {
        require(bytes(pubKeys[_usernameHash]).length == 0, "Key already registered for this hash");
        pubKeys[_usernameHash] = _pubKey;
        emit PubKeyRegistered(_usernameHash, _pubKey);
    }

    /**
     * @dev Retrieve a public key by username hash.
     * @param _usernameHash The keccak256 hash of the username
     * @return The Base64 encoded RSA-OAEP public key
     */
    function getPubKey(bytes32 _usernameHash) public view returns (string memory) {
        return pubKeys[_usernameHash];
    }
}
