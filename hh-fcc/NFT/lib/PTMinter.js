const ethers = require("ethers")

// These constants must match the ones used in the smart contract.
const SIGNING_DOMAIN_NAME = "PT-Voucher"
const SIGNING_DOMAIN_VERSION = "1"

/**
 * JSDoc typedefs.
 *
 * @typedef {object} NFTVoucher
 * @property {ethers.BigNumber | number} tokenId the id of the un-minted NFT
 * @property {ethers.BigNumber | number} minPrice the minimum price (in wei) that the creator will accept to redeem this NFT
 * @property {ethers.BigNumber | number} maxPrice the minimum price (in wei) that the creator will accept to redeem this NFT
 * @property {string} uri the metadata URI to associate with this NFT
 * @property {ethers.BytesLike} signature an EIP-712 signature of all fields in the NFTVoucher, apart from signature itself.
 */

/**
 * PTMinter is a helper class that creates NFTVoucher objects and signs them, to be redeemed later by the LazyNFT contract.
 */
class PTMinter {
    /**
     * Create a new PTMinter targeting a deployed instance of the LazyNFT contract.
     *
     * @param {Object} options
     * @param {ethers.Contract} contract an ethers Contract that's wired up to the deployed contract
     * @param {ethers.Signer} signer a Signer whose account is authorized to mint NFTs on the deployed contract
     */
    constructor({ ptNFT, signer }) {
        this.contract = ptNFT
        this.signer = signer
    }

    /**
     * Creates a new NFTVoucher object and signs it using this PTMinter's signing key.
     *
     * @param {ethers.BigNumber | number} tokenId the id of the un-minted NFT
     * @param {string} uri the metadata URI to associate with this NFT
     * @param {ethers.BigNumber | number} minPrice the minimum price (in wei) that the creator will accept to redeem this NFT. defaults to zero
     * @param {ethers.BigNumber | number} maxPrice the minimum price (in wei) that the creator will accept to redeem this NFT. defaults to zero
     * @returns {NFTVoucher}
     */
    async createVoucher(tokenId, uri, maxPrice = 2, minPrice = 0) {
        const voucher = { tokenId, uri, minPrice, maxPrice }
        const domain = await this._signingDomain()
        const types = {
            NFTVoucher: [
                { name: "tokenId", type: "uint256" },
                { name: "minPrice", type: "uint256" },
                { name: "maxPrice", type: "uint256" },
                { name: "uri", type: "string" },
            ],
        }
        const signature = await this.signer._signTypedData(domain, types, voucher)
        return {
            ...voucher,
            signature,
        }
    }

    /**
     * @private
     * @returns {object} the EIP-721 signing domain, tied to the chainId of the signer
     */
    async _signingDomain() {
        if (this._domain != null) {
            return this._domain
        }

        const chainId = await this.contract.getChainID()
        this._domain = {
            name: SIGNING_DOMAIN_NAME,
            version: SIGNING_DOMAIN_VERSION,
            verifyingContract: this.contract.address,
            chainId,
        }
        return this._domain
    }
}

module.exports = {
    PTMinter,
}
