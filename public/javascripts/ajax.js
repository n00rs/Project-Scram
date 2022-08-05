

// USER BLOCKING 

function blockFunc(userId, email, action) {
    if (action == 'block') {
        swal({
            title: "Are You Sure To Block this ID " + email + "   ?",
            text: "",
            icon: "warning",
            dangerMode: true,
            buttons: true,
            closeOnClickOutside: false,
        })
            .then((ok) => {
                if (ok) {
                    $.ajax({
                        url: "/admin/blockUser",
                        data: { id: userId },
                        method: 'get',
                        success: (result) => {
                            if (result) {
                                swal(email + " This id  has been blocked")
                                setTimeout(() => {
                                    location.reload()
                                }, 1000)
                            } else {
                                swal('Something Went Wrong')
                            }
                        }
                    })
                }
            })
    } else {
        swal({
            title: "Do you wanna unblock this ID " + email + "?",
            icon: "warning",
            // dangerMode: true,
            buttons: true,
            closeOnClickOutside: false
        })
            .then((ok) => {
                if (ok) {
                    $.ajax({
                        url: "/admin/blockUser",
                        data: { id: userId },
                        method: 'get',
                        success: (result) => {
                            if (result) {
                                swal(email + " This ID has been unblocked");
                                setTimeout(() => {
                                    location.reload()
                                }, 1000)
                            } else {
                                swal('Something Went Wrong')
                            }
                        }
                    })
                }
            })

    }
}


//REMOVE USER
function removeUser(userId, email) {
    swal({
        title: 'Delete user with this ID "' + email + '" ?',
        buttons: true,
        icon: 'warning',
        closeOnClickOutside: false,
        className: 'swal'
    }).then((ok) => {
        if (ok) {
            $.ajax({
                url: 'removeUser',
                data: { id: userId },
                method: 'get',
                success: (result) => {
                    if (result) {
                        swal(email + ' this ID has been removed')
                        setTimeout(() => {
                            location.reload()
                        }, 1000)
                    } else {
                        swal({
                            title: 'OOPS ! SOMETHING WENT WRONG WE ARE WORKING ON THAT',
                            icon: "error"
                        })
                    }
                }
            })
        }
    })
}

function blockedUsers() {

}

function deleteProduct(productId) {
    swal({
        title: "delete this product  ?",
        buttons: true,
        icon: "warning",
        closeOnClickOutside: false,

    }).then((ok) => {
        if (ok) {
            $.ajax({
                url: 'deleteProduct',
                data: { id: productId },
                method: 'get',
                success: (result) => {
                    if (result.itemRemoved) {
                        swal({
                            title: "ProductRemoved",
                            className: 'swal'
                        })
                        setTimeout(() => {
                            location.reload()
                        }, 1000)
                    }

                }
            })
        }
    })
}

function sort(category, type) {
    console.log(type);
    $.ajax({
        url: '/sort',
        data: {
            category: category,
            sortType: type
        },
        method: 'get',
        success: (result) => {
            product = "{{#each " + result + "}}"
            console.log(product);
            $('#product').html(product)

            // document.getSelection('ajax') ==result;

            // location.reload()
            alert('success')
        }
    })
}

function sortSize(value) {
    console.log(value);
    const sortSelection = $('#sortSelection').val()
    console.log(sortSelection);
    let sizeArray = [];

    $("input:checkbox[name=size]:checked").each(function () {
        sizeArray.push($(this).val());
    });
    console.log(sizeArray);
    location.href = onclick = `/category?size=${sizeArray}&category=${value}&sort=${sortSelection}`

}

// CART FUNCTIONS

function addToCart(prodId, prodName, subcategory, category, prodPrice, selectedSize, wishlistId) {
    console.log(prodId, prodName, subcategory, category, prodPrice, selectedSize, wishlistId);
    let body = {
        id: prodId, name: prodName,
        subcategory: subcategory, category: category,
        price: prodPrice, selectedSize: selectedSize
    }
    $.ajax({
        url: "/add-to-cart",
        data: body,
        method: 'post',
        success: (result) => {
            if (result.success) {

                let count = $("#cartCount").html()
                count = parseInt(count) + 1;
                $('#cartCount').html(count)

                swal({ title: result.success });

                setTimeout(() => {                                                                                                   // just for fun  how many functions are there
                    swal.close()
                    if(wishlistId) removeWishlistItem(wishlistId, prodId) ; setTimeout(() => swal.close(), 5000)
                }, 2000)
            } else {
                swal({
                    title: result.error,
                    text: "click to login",
                    icon: "warning",
                    buttons: {
                        cancel: {
                            text: "Cancel",
                            value: null,
                            visible: true,
                            closeModal: true,
                        },
                        confirm: {
                            text: "Login",
                            value: true,
                            visible: true,
                            closeModal: true
                        }
                    }
                }).then((login) => { if (login) location.href = "/login" })

                setTimeout(() => swal.close(), 10000)
            }
        }
    })
}

function changeQuantity(prodId, cartId, count) {
    // console.log(prodId,"prod",cartId,'cart',count);
    let quantity = document.getElementById(prodId).innerHTML
    console.log(quantity);
    $.ajax({
        url: "/changeQuantity",
        data: {
            id: prodId,
            cartId: cartId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.productRemoved) {
                swal({ title: "Item Removed from the cart" })
                setTimeout(() => {
                    location.reload()
                }, 1000)

            } else {
                document.getElementById(prodId).innerHTML = parseInt(quantity) + count;
                let total = response.total.total
                // console.log(result);

                document.getElementById('total').innerHTML = total;
                $('#grandTotal').html(total)

            }
        }
    })
}

function removeItem(cartId, prodId, prodName) {

    swal({
        title: "Remove " + prodName + " from your cart  ? ",
        buttons: true,
        icon: 'warning',
    }).then((ok) => {
        if (ok) {
            $.ajax({
                url: "/remove-cart-item/" + cartId + "/" + prodId,

                method: 'get',
                success: (result) => {
                    if (result.itemRemoved) {

                        swal({ title: "Item removed from your cart" })
                        setTimeout(() => {
                            location.reload()
                        }, 1000)
                    }
                }
            })
        }
    }).catch((err) => {
        swal({ title: 'opps Somtheing went wrong' + err })
    })
}

function checkCouponCode(couponCode, total) {
    console.log(total);
    $.ajax({
        url: "/cart/confirm-coupon",
        data: {
            code: couponCode,
            cartTotal: total
        },
        method: 'post',
        success: (result) => {
            console.log(result);
            if (result.validCoupon) {
                $('#couponValid').show()
                $('#couponValid').html('<i class="text-success fa-regular fa-circle-check"></i>  Valid Code')
                setTimeout(() => {
                    $("#couponInput").attr("disabled", "disabled")
                    // document.getElementById('couponValid').disabled = true ;
                    console.log('hi');
                }, 3000)

                $("#discount").html(result.discount);

                let total = $("#grandTotal").html();
                newTotal = parseInt(total) - result.discount;
                $('#grandTotal').html(newTotal);

            }
            else {
                $('#couponValid').show()
                $('#couponValid').html('<i class="fa-solid text-danger fa-xmark"></i> Invalid Code')
                $("#discount").html(0)
                setTimeout(() => {
                    $('#couponValid').hide()
                }, 3000)
            }
        }

    })
}

function updateSize(cartId, prodId, size) {
    // console.log(cartId); 
    $.ajax({

        url: "/cart/update-size",
        data: {
            cartId: cartId,
            prodId: prodId,
            selectedSize: size
        },
        method: 'put',
        success: (result) => {
            if (result.sizeSelected)
                $('#size').load(location.href + " #size")
            else
                swal({ title: "server busy try again" })
            setTimeout(() => {
                swal.close
            }, 4000)
        }
    })
}




// USER- SIDE PROFILE UPDATE

$(document).ready(function () {
    $('#address-form').on('submit', function (event) {
        event.preventDefault();
        const building_name = $("#building_no").val()
        const street = $('#street').val();
        const city = $('#city').val();
        const country = $("#country").val();
        const pincode = $("#pincode").val();
        const userId = $('#userId').val();

        console.log(building_name, street, city, country, pincode, userId);
        $.ajax({
            url: "/profile/add-address",
            data: {
                building_name: building_name,
                street: street,
                city: city,
                country: country,
                pincode: pincode,
                userId: userId,
            },
            method: "post",
            success: (result) => {
                if (result.status) {
                    // location.reload()
                    $("#address").load(location.href + " #address");        //to reload only div
                    $('#add-address').load(location.href + " #add-address")
                } else {
                    swal("oops ")
                }
            }
        })
    })
})

$("#nameUpdate").click(() => {
    $("#updateName").toggle();
});

$(document).ready(function () {
    $('#updateName').on('submit', function (event) {
        event.preventDefault();
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const userId = $("#userId").val();

        console.log(firstName, lastName);
        $.ajax({
            url: "/profile/update-name",
            data: {
                firstName: firstName,
                lastName: lastName,
                userId: userId,
            },
            method: 'post',
            success: (result) => {
                if (result.status)
                    $("#name").load(location.href + " #name");
                else
                    swal({ title: "oops somthing went wrong" })
            }
        })

    })
})

$("#add-address").click(function () {
    $("#address-form").toggle();
})


function removeAddress(addressId, userId) {
    swal({
        title: "remove this address field ? ",
        buttons: true,
        icons: 'warning',
        closeOnClickOutside: false,

    }).then((ok) => {
        if (ok) {
            console.log(addressId, 'address', userId, 'user');
            $.ajax({
                url: "/profile/remove-address",
                data: {
                    addressId: addressId,
                    userId: userId
                },
                method: 'get',
                success: (result) => {
                    if (result.status) {
                        $('#address').load(location.href + " #address")
                    } else {
                        swal({ title: "oops something went wrong ...!" })
                    }
                }

            })
        }
    })
}

$('#updatePhone').click(function () {
    $("#verifyPhone").toggle();
})

function confirmEmail(userInput) {
    console.log(userInput);
    $.ajax({
        url: "/change-password/check-user",
        data: { userInput: userInput },
        method: 'get',
        success: function (result) {
            if (result.status) {

                document.getElementById('checkResult').innerHTML = "<i class='text-success fa-solid fa-check'></i> User confirmed "
                document.getElementById('change-password').disabled = false;
            } else {

                document.getElementById('checkResult').innerHTML = " <i class= 'text-danger fa-solid fa-xmark' ></i> User not found"
                document.getElementById('change-password').disabled = true;
            }
        }
    })
}

//  WISHLIST functions

function addToWishlist(prodId) {
    console.log(prodId)
    $.ajax({
        url: "/add-to-wishlist",
        data: {
            productId: prodId,
        },
        method: 'post',
        success: (result) => {
            if (result.success) {

                let count = $("#wishCount").html();

                count = parseInt(count) + 1;

                $('#wishCount').html(count);
                swal({ title: result.success });
                setTimeout(() => {
                    swal.close()
                }, 1000)
            } else {
                swal({
                    title: result.error,
                    text: "click to login",
                    icon: "warning",
                    buttons: {
                        cancel: {
                            text: "Cancel",
                            value: null,
                            visible: true,
                            closeModal: true,
                        },
                        confirm: {
                            text: "Login",
                            value: true,
                            visible: true,
                            closeModal: true
                        }
                    }

                }).then((login) => {
                    if (login) location.href = "/login"
                })
                setTimeout(() => swal.close(), 10000)
            }
        }

    })
}

function removeWishlistItem(wishlistId, prodId) {

    // console.log(wishlistId, 'wishlist', prodId, 'prodid')
    swal({
        title: "Remove this item from wishlist",
        buttons: true,
        icon: "warning",
        closeOnClickOutside: false
    }).then((ok) => {
        if (ok) {
            $.ajax({

                url: "/wishlist/remove-item/" + wishlistId + "/" + prodId,

                method: "delete",
                success: (result) => {
                    if (result.status) {

                        swal({ title: result.status })
                        setTimeout(() => {
                            $('#wishlistItems').load(location.href + " #wishlistItems")
                            swal.close()
                        }, 1000)
                    }
                }
            })
        }
    })
}

function loadPlaceOrder() {
    let total = $('#grandTotal').html()
    location.href = '/place-order?total=' + total;
}





