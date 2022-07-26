require("dotenv").config();
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const twilio = require("../config/twilio");
const userHelpers = require("../helpers/userHelpers");
const paytmConfig = require("../config/paytmConfig");
const stripeConfig = require("../config/stripeConfig");
const adminHelpers = require("../helpers/adminHelpers");
const PORT = process.env.PORT;

const verifyUser = (req, res, next) => (req.session.loggedIn ? next() : res.redirect("/login"));

router.get("/", async (req, res) => {
  try {
    let user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;
    let coupon = await userHelpers.fetchCoupon();
    const count = await fetchCounts(wishId, cartId);

    res.render("user/landing-page", { user: true, count, user1, coupon });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// user -- login

router.get("/login", (req, res) => {
  try {
    if (req.session.loggedIn) res.redirect("/");
    else {
      res.render("user/login", { user: true, idError: req.session.idError });
      req.session.idError = false;
    }
  } catch (err) {
    res.redirect(`/error/${err}`);
  }
});

router.post("/login", (req, res) => {
  try {
    let sessionId = req.sessionID;
    userHelpers
      .userLogin(req.body, sessionId)
      .then((result) => {
        if (result.status) {
          req.session.loggedIn = true;
          req.session.user = result.user;
          res.redirect("/");
        }
      })
      .catch((err) => {
        req.session.idError = err;
        res.redirect("/login");
      });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// user--signup

router.get("/signup", (req, res) => {
  res.render("user/signup", { user: true, idError: req.session.Error });
  req.session.Error = false;
});

router.post("/signup", (req, res) => {
  try {
    let signupData = {};
    signupData["email"] = req.body.email;
    signupData["phone"] = req.body.phone;
    signupData["password"] = req.body.password;
    signupData["firstName"] = req.body.firstName;
    signupData["lastName"] = req.body.lastName;
    signupData["gender"] = req.body.gender;

    userHelpers
      .userSignup(signupData)
      .then((result) => res.redirect("/login"))
      .catch((err) => {
        req.session.Error = err;
        res.redirect("/signup");
      });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// MAIN

router.get("/category", async (req, res) => {
  try {
    if (Object.keys(req.query).length === 0) throw new Error("opps something went wrong");
    let user1 = req.session.user;

    let wishId = user1 ? user1._id : req.sessionID;

    let cartId = user1 ? user1._id : null;
    let category = req.query.category;
    let filterSize = req.query.size ? req.query.size.split(",") : "";
    let sortBy = req.query.sort;
    const count = await fetchCounts(wishId, cartId);
    let products = await userHelpers.fetchCategory(category);

    if (filterSize != "")
      products = products.filter((product) =>
        product.modelDetails.size.some((y) => filterSize.includes(y.size))
      );

    if (sortBy != "") products = sort(sortBy, products);

    res.render("user/category", {
      user: true,
      user1,
      category,
      products,
      filterSize,
      sortBy,
      count,
    });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/search", (req, res) => {
  try {
    userHelpers.search(
      req.body,
      (result) => res.json(result),
      (err) => res.status(500).json(err)
    ); //using call back instead promise
  } catch (err) {
    res.redirect(`/error/${error}`);
  }
});

router.get("/world-title", async (req, res) => {
  try {
    let user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    const worldTitle = await userHelpers.fetchWorldTitle();

    let worldTitleId = worldTitle ? worldTitle._id : null;

    res.render("user/world-title", { user: true, user1, worldTitleId, count });
  } catch (err) {
    res.redirect(`/error/${err}`);
  }
});

router.get("/pista-gp-rr", async (req, res) => {
  try {
    let user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    const pistaGp = await userHelpers.fetchPistaGp();

    let pistaGpId = pistaGp ? pistaGp._id : null;

    res.render("user/pista-gp-rr", { user: true, user1, pistaGpId, count });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/join-community", (req, res) => {
  try {
    userHelpers
      .joinCommunity(req.body)
      .then((result) => res.json(result))
      .catch((err) => res.json(err));
  } catch (error) {
    res.json({ error: error.message });
  }
});

router.get("/about-us", async (req, res) => {
  try {
    let user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    res.render("user/about-us", { user: true, user1, count });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.get("/view-product/:id", async (req, res) => {
  try {
    let user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    let id = req.params.id;

    let product = await userHelpers.fetchProduct(id);

    res.render("user/view-product", { user: true, user1, product, count });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// CART  ROUTES

router.post("/add-to-cart", verifyUser, (req, res) => {
  try {
    let user = req.session.user;
    if (!user) throw new Error("no user");

    userHelpers
      .addToCart(req.body, user._id)
      .then((result) => res.json(result))
      .catch((err) => res.json(err));
  } catch (error) {
    let errorMsg = "Please Login and try again ";
    res.json({ error: errorMsg });
  }
});

router.get("/cart", verifyUser, async (req, res) => {
  try {
    const user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    let cartItems = await userHelpers.fetchCart(user1._id);

    if (cartItems == null) var total = 0;
    else total = await userHelpers.totalAmount(cartItems._id);
    req.session.total = total; //saving total amount for further use

    let offers = await userHelpers.fetchOffers(user1._id);

    res.render("user/cart", {
      user: true,
      user1,
      count,
      offers,
      cartItems,
      total,
    });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/changeQuantity", (req, res) => {
  try {
    userHelpers
      .changeCartQuantity(req.body)
      .then(async (result) => {
        result.total = await userHelpers.totalAmount(req.body.cartId);
        req.session.total = result.total; //saving total amount for further use
        res.json(result);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.delete("/remove-cart-item/:cartId/:prodId/:selectedSize", (req, res) => {
  try {
    userHelpers
      .removeCartItem(req.params)
      .then((result) => res.json(result))
      .catch((err) => res.json(err));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/cart/confirm-coupon", (req, res) => {
  try {
    let couponCode = req.body.code;
    let cartTotal = req.session.total.total;

    userHelpers
      .checkCouponCode(couponCode, cartTotal)
      .then((result) => res.json(result))
      .catch((error) => res.json(error));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.put("/cart/update-size", (req, res) => {
  try {
    userHelpers
      .updateSize(req.body)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.json(error);
      });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// WISHLIST

router.get("/wishlist", async (req, res) => {
  try {
    const user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    let wishlist = await userHelpers.fetchWishlist(wishId);

    res.render("user/wishlist", { user: true, wishlist, count, user1 });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/add-to-wishlist", (req, res) => {
  try {
    const user = req.session.user ? true : false;

    const id = user ? req.session.user._id : req.sessionID;

    const prodId = req.body.productId;

    userHelpers
      .addToWishlist(id, prodId, user)
      .then((result) => res.json(result))
      .catch((error) => res.json(error));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.delete("/wishlist/remove-item/:wid/:pid", (req, res) => {
  //wid & pid is sent from ajax

  try {
    const wishlistId = req.params.wid;
    const prodId = req.params.pid;

    userHelpers
      .removeWishlistItem(wishlistId, prodId)
      .then((result) => res.json(result))
      .catch((error) => res.json(error));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// USER PROFILE ROUTES

router.get("/profile", verifyUser, async (req, res) => {
  try {
    const userId = req.session.user._id;
    let user1 = await userHelpers.fetchUserData(userId);
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    res.render("user/user-profile", {
      user: true,
      user1,
      twilioError: req.session.otpError,
      count,
    });

    req.session.otpError = false;
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/verifyPhone", verifyUser, (req, res) => {
  try {
    let phone = req.body.phone;

    userHelpers
      .checkPhone(phone)
      .then((result) => {
        twilio
          .sendOtp(phone)
          .then((result) => res.render("user/otp", { user: true, phone }))

          .catch((err) => {
            req.session.otpError = "Server not responding try again later";
            res.redirect("/profile");
          });
      })
      .catch((err) => {
        req.session.otpError = err;
        res.redirect("/profile");
      });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/otp", verifyUser, (req, res) => {
  try {
    const userId = req.session.user._id;
    const otp = req.body.otp.join(""); //otp from form was in array converted it into string
    const phone = req.body.phone;

    twilio
      .verifyOtp(otp, phone)
      .then(() => {
        userHelpers.verifyPhone(userId, phone).then(() => res.redirect("/profile"));
      })
      .catch((err) => {
        req.session.otpError = err;
        res.redirect("/profile");
      });
  } catch (err) {
    res.redirect(`/error/${err}`);
  }
});

router.post("/profile/image-upload", verifyUser, (req, res) => {
  try {
    if (req.files) {
      const userImage = req.files.userImage;
      const id = req.session.user._id;

      userImage.mv("./public/images/user_images/" + id + ".jpg");
      res.redirect("/profile");
    } else {
      res.redirect("/profile");
    }
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/profile/add-address", verifyUser, (req, res) => {
  try {
    userHelpers
      .addAddress(req.body)
      .then(() => res.json({ status: true }))
      .catch((err) => res.json(err));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.put("/profile/update-name", verifyUser, (req, res) => {
  try {
    userHelpers.updateName(req.body).then((result) => {
      res.json({ status: true });
    });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.delete("/profile/remove-address", verifyUser, (req, res) => {
  try {
    userHelpers
      .removeAddress(req.body)
      .then((result) => res.json({ status: true }))
      .catch((err) => res.json({ status: false }));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.get("/change-password", async (req, res) => {
  try {
    const user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);
    res.render("user/change-password", {
      user: true,
      error: req.session.changePasswordErr,
      user1,
      count,
    });
    req.session.changePasswordErr = false;
  } catch (err) {
    res.redirect(`/error/${err}`);
  }
});

router.get("/change-password/check-user", (req, res) => {
  try {
    userHelpers
      .checkEmail(req.query)
      .then(() => res.json({ status: true }))
      .catch(() => res.json({ status: false }));
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/change-password", (req, res) => {
  try {
    userHelpers
      .changePassword(req.body)
      .then((result) => {
        req.session.destroy();
        res.redirect("/login");
      })
      .catch((err) => {
        req.session.changePasswordErr = err;
        res.redirect("/change-password");
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contactus", async (req, res) => {
  try {
    const user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);
    res.render("user/contactus", { user: true, user1, count });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

// ORDER PLACING  ORDER PLACEING

router.post("/place-order", verifyUser, async (req, res) => {
  try {
    const couponCode = req.body.couponInput; // discount code from req.body

    var grandTotal = req.session.total.total; // total from session

    let discountData = null;

    const userId = req.session.user._id;

    const user1 = await userHelpers.fetchUserData(userId);
    const userCart = await userHelpers.fetchCart(userId);
    if (couponCode) {
      await userHelpers
        .checkCouponCode(couponCode, grandTotal)
        .then((res) => {
          discountData = res;
          discountData.couponCode = couponCode;
        })
        .catch((err) => (discountData = null));
    }

    res.render("user/place-order", {
      user: true,
      grandTotal,
      user1,
      userCart,
      discountData,
    });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const paymentMethod = req.body.paymentMethod;
    const couponCode = req.body.couponCode;
    const userCart = await userHelpers.fetchCart(userId);
    var cartTotal = req.session.total.total;
    req.session.total = null;
    let discountData = null;

    if (couponCode) {
      await userHelpers
        .checkCouponCode(couponCode, cartTotal)
        .then((res) => {
          discountData = res;
          discountData.couponCode = couponCode;
        })
        .catch((err) => (discountData = null));
    }

    userHelpers
      .newOrder(req.body, userId, userCart, cartTotal, discountData)
      .then((result) => {
        userHelpers.deleteCoupon(userId);
        switch (paymentMethod) {
          case "COD": {
            res.json(result);
            break;
          }
          case "STRIPE": {
            let total = discountData ? discountData.total : cartTotal;
            let orderId = result.orderId;

            stripeConfig
              .stripeCheckOut(req.body, total, orderId)
              .then((result) => res.json(result))
              .catch((err) => res.json(err));

            break;
          }
          case "PAYTM": {
            let total = discountData ? discountData.total : cartTotal;
            let orderId = result.orderId;

            paytmConfig
              .paytmPayments(req.body, total, orderId)
              .then((result) => res.json(result))
              .catch((err) => res.json(err));
            break;
          }
        }
      })
      .catch((error) => res.json(error));
  } catch (error) {
    res.json({ err: error.message });
    res.redirect(`/error/${error}`);
  }
});

router.post(
  "/stripe-status",
  bodyParser.raw({ type: "application/json" }),
  stripeConfig.stripeWebhook
);

router.post("/paytm-status", paytmConfig.callback);

router.get("/order-confirmation/:paymentConfirm", (req, res) => {
  try {
    let paymentConfirm = req.params.paymentConfirm;
    let paymentError = paymentConfirm !== "success" ? true : false;
    res.render("user/order-confirmation", {
      user: true,
      paymentConfirm,
      paymentError,
    });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.get("/orders", verifyUser, async (req, res) => {
  try {
    const user1 = req.session.user;
    let wishId = user1 ? user1._id : req.sessionID;
    let cartId = user1 ? user1._id : null;

    const count = await fetchCounts(wishId, cartId);

    const userId = req.session.user._id;

    const orders = await userHelpers.fetchOrders(req.query, userId);

    res.render("user/each-orderDetails", { user: true, orders, user1, count });
  } catch (error) {
    res.redirect(`/error/${error}`);
  }
});

router.put("/orders/cancel", (req, res) => {
  try {
    updateStatus = "cancel";
    adminHelpers
      .updateOrderStatus(req.body)
      .then((result) => res.json(result))
      .catch((err) => res.json(err));
  } catch (error) {
    res.json({ err: "something's wrong try aganin later" });
  }
});

router.get("/error/:error", (req, res) => {
  let error = req.params.error;
  res.render("error", { error });
});

router.get("/port", (req, res) => {
  res.send(`server port ${PORT}`);
});
module.exports = router;

async function fetchCounts(wishId, cartId) {
  let count = {};
  count.cartCount = null;
  count.wishlistCount = null;

  count.wishlistCount = await userHelpers.fetchWishlistCount(wishId.toString());

  if (cartId) count.cartCount = await userHelpers.fetchCartCount(cartId);

  return count;
}

function sort(sortBy, array) {
  return sortBy === "price_asc"
    ? array.sort((a, b) => a.modelDetails.price - b.modelDetails.price)
    : sortBy === "price_desc"
    ? array.sort((a, b) => b.modelDetails.price - a.modelDetails.price)
    : sortBy === "new"
    ? array.reverse()
    : array;
}
