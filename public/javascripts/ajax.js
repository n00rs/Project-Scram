

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

function addToCart(prodId, selectedSize, wishlistId) {
    console.log(prodId, selectedSize, wishlistId);
    let body = {
        prodId: prodId, selectedSize: selectedSize
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
                    if (wishlistId) removeWishlistItem(wishlistId, prodId); setTimeout(() => swal.close(), 3000)                       //after success asking whthr to remove the item from wish list
                }, 2000)

            } else if (result.fail) {
                swal({ title: result.fail })
                setTimeout(() => swal.close(), 2000)
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

function changeQuantity(prodId, cartId, selectedSize, count) {
    // console.log(prodId,"prod",cartId,'cart',count);
    let quantity = document.getElementById(prodId + selectedSize).innerHTML
    let body = {
        prodId: prodId,
        cartId: cartId,
        count: count,
        quantity: quantity,
        selectedSize: selectedSize
    }
    $.ajax({
        url: "/changeQuantity",
        data: body,
        method: 'post',

        success: (response) => {

            if (response.productRemoved) {
                swal({ title: "Item Removed from the cart" })
                setTimeout(() => {
                    location.reload()
                }, 1000)

            } else if (response.productAdded) {
                let total = response.total.total
                document.getElementById(prodId + selectedSize).innerHTML = parseInt(quantity) + count;
                document.getElementById('total').innerHTML = total;
                $('#grandTotal').html(total)

            } else swal("opps something went wrong try again later")
        }
    })
}

function removeItem(cartId, prodId, prodName, selectedSize) {

    swal({
        title: "Remove " + prodName + " from your cart  ? ",
        buttons: true,
        icon: 'warning',
    }).then((ok) => {
        if (ok) {
            $.ajax({
                url: "/remove-cart-item/" + cartId + "/" + prodId + "/" + selectedSize,

                method: 'delete',
                success: (result) => {
                    if (result.itemRemoved) {

                        swal({ title: "Item removed from your cart" })
                        setTimeout(() => {
                            location.reload()
                        }, 1000)
                    } else swal("opps something went wrong try again later")
                }
            })
        }
    }).catch((err) => {
        swal({ title: 'opps Somtheing went wrong' + err })
    })
}

function checkCouponCode(couponCode) {
    // console.log(total);
    $.ajax({
        url: "/cart/confirm-coupon",
        data: {
            code: couponCode,
            // cartTotal: total
        },
        method: 'post',
        success: (result) => {

            if (result.validCoupon) {

                $('#couponValid').show()
                $('#couponValid').html('<i class="text-success fa-regular fa-circle-check"></i>  Valid Code')
                setTimeout(() => {
                    // $("#couponInput").attr("disabled", "disabled")
                    $("#couponInput").prop("readonly", true);
                    // document.getElementById('couponValid').disabled = true ;
                    console.log('hi');
                }, 1000)

                $("#discount").html(result.discount);

                $("#grandTotal").html(result.total);



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
                $('#sizeDiv').load(location.href + " #sizeDiv");
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

function cancelOrderUser(orderId, prodId, currentStatus, prodName, size,) {

    let status = (currentStatus) === 'confirmed' ? 'confirmed & cancelled' : "notConfirmed & cancelled"

    // console.log('inside cancel');
    // console.log(`orderId :${orderId}  prodId :${prodId} status: ${status} prodName: ${prodName}, size: ${newStatus}`) ;
    body = { orderId: orderId, prodId: prodId, orderStatus: status, selectedSize: size }
    swal({
        title: `DO you wanna cancel ${prodName} ? `,
        icon: "warning",
        closeOnClickOutside: false,
    }).then((ok) => {
        if (ok) {
            $.ajax({
                url: "/orders/cancel",
                data: body,
                method: 'put',
                success: (result) => {
                    if (result.success) {
                        swal({ title: result.success, icon: "success" })
                        setTimeout(() => location.reload(), 2000)
                    }
                    else if (result.fail) {
                        ({ title: result.fail, icon: "error" })
                        setTimeout(() => swal.close(), 2000)
                    }
                    if (result.error) swal({ title: result.error, icon: "error" })
                }
            })
        }
    })
}


function searchProd(searchKey) {
    // $(window).click(function() {
    //     //Hide the menus if visible
    //     console.log('inside win')
    //     $('#searchResults').t()
    //   })
   
    console.log(searchKey,"null"); 
     
    let searchDiv = document.getElementById('searchResults');
    let searchinput = searchKey.match(/^([A-Za-z0-9]+ )+[A-Za-z0-9]+$|^[A-Za-z0-9]+$/);
try {
    if(searchKey == '') throw new Error ()
    if (searchinput[0] === searchKey) {
        fetch('/search', {
            method: 'POST',
            headers: { 'content-Type': 'application/json' },
            body: JSON.stringify({ searchKey: searchKey }),
            
        }).then(res => res.json())
            .then((res) => {
                searchDiv.innerHTML = '';
                if (res.err || res.length < 1) {
                    searchDiv.innerHTML +=` <li>Item not found </li>`
                } else {
                    console.log(res)
                    res.forEach((item, index) => {
                        if (index > 0) searchDiv.innerHTML += '<hr>';
                        searchDiv.innerHTML += `<li><a href="/view-product/${item._id}" >${item.modelDetails.name} 
                        <img src='/images/product_images/${item._id}_1.jpg'style=" height: 30px;" ></a> </li>`
                    });
                }
            })
            // .catch(err =>  {searchDiv.innerHTML +=` <li><a>Item not found </a></li>`})
    }
} catch (error) {
    {searchDiv.innerHTML = '';
        searchDiv.innerHTML +=` <li><a>Item not found </a></li>`}
}
  
   

}


function copyCouponCode(coupun) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(coupun).text()).select();
    document.execCommand("copy");
    $temp.remove();
  }
// function countdown(){
//     console.log('inside script')
//  // Set the date we're counting down to
// let count = $("#countdown").val()
// console.log(count);
//  let countDownDate = (document.getElementById("countdown").outerHTML * (1000 * 60 * 60 * 24)) + new Date().getTime()

//  console.log(countDownDate)
//  console.log('hey yeo')

//  // Update the count down every 1 second
//  let x = setInterval(function () {

//   // Get today's date and time
//   var now = new Date().getTime()
//   console.log(now, '...timeRN')

//   // Find the distance between now and the count down date
//   var distance = countDownDate - now;
//   console.log(distance)
//   // Time calculations for days, hours, minutes and seconds
//   var days = Math.floor(distance / (1000 * 60 * 60 * 24));
//   var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//   var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
//   var seconds = Math.floor((distance % (1000 * 60)) / 1000);

//   // Output the result in an element with id="demo"
//   document.getElementById("countdown").innerHTML = days + "D " + hours + "H "
//    + minutes + "M " + seconds + "S ";

//   // If the count down is over, write some text 
//   if (distance < 0) {
//    clearInterval(x);
//    document.getElementById("countdown").innerHTML = "NO OFFERS AVAILABLE FOR NOW";
//   }
//  }, 1000);
// }





