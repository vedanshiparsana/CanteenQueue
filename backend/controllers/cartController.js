const Cart = require("../models/Cart");
const Menu = require("../models/Menu");

// Get user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId })
            .populate("items.menuId");

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                data: {
                    items: [],
                    runningTotal: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch cart",
            error: error.message
        });
    }
};


// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { menuId, quantity } = req.body;

        if (!menuId || !quantity) {
            return res.status(400).json({
                success: false,
                message: "menuId and quantity are required"
            });
        }

        const menuItem = await Menu.findById(menuId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        if (!menuItem.isAvailable) {
            return res.status(400).json({
                success: false,
                message: "Menu item is currently unavailable"
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [],
                runningTotal: 0
            });
        }

        const existingItem = cart.items.find(
            item => item.menuId.toString() === menuId
        );

        if (existingItem) {
            existingItem.quantity += Number(quantity);
        } else {
            cart.items.push({
                menuId,
                quantity: Number(quantity)
            });
        }

        // Recalculate total
        let total = 0;

        for (const item of cart.items) {
            const menu = await Menu.findById(item.menuId);

            if (menu) {
                total += menu.price * item.quantity;
            }
        }

        cart.runningTotal = total;

        await cart.save();

        await cart.populate("items.menuId");

        res.status(200).json({
            success: true,
            message: "Item added to cart",
            data: cart
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to add item to cart",
            error: error.message
        });
    }
};


// Update cart item quantity
const updateCartQuantity = async (req, res) => {
    try {
        const userId = req.user.id;
        const { menuId, quantity } = req.body;

        if (!menuId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "menuId and quantity are required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            item => item.menuId.toString() === menuId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        item.quantity = Number(quantity);

        // Recalculate total
        let total = 0;

        for (const cartItem of cart.items) {
            const menu = await Menu.findById(cartItem.menuId);

            if (menu) {
                total += menu.price * cartItem.quantity;
            }
        }

        cart.runningTotal = total;

        await cart.save();

        await cart.populate("items.menuId");

        res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            data: cart
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update cart",
            error: error.message
        });
    }
};


// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { menuId } = req.params;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        const itemExists = cart.items.some(
            item => item.menuId.toString() === menuId
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        cart.items = cart.items.filter(
            item => item.menuId.toString() !== menuId
        );

        // Recalculate total
        let total = 0;

        for (const cartItem of cart.items) {
            const menu = await Menu.findById(cartItem.menuId);

            if (menu) {
                total += menu.price * cartItem.quantity;
            }
        }

        cart.runningTotal = total;

        await cart.save();

        await cart.populate("items.menuId");

        res.status(200).json({
            success: true,
            message: "Item removed from cart",
            data: cart
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to remove item from cart",
            error: error.message
        });
    }
};


module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart
};