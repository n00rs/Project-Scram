

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

function addToCart(prodId, prodName, subcategory, category, prodPrice, prodSize) {
    console.log(prodId, prodName, prodPrice, subcategory, category, prodSize)
    $.ajax({
        url: "/add-to-cart",
        data: {
            id: prodId,
            name: prodName,
            subcategory: subcategory,
            category: category,
            price: prodPrice,
            size: prodSize
        },
        method: 'get',
        success: (result) => {
            if (result.status) {

                let count = $("#cartCount").html()
                count = parseInt(count) + 1;
                $('#cartCount').html(count)
                // swal({title:"item added to cart"})


            }

        }
    })

}

function changeQuantity(prodId,cartId,count) {
    console.log(prodId,"prod",cartId,'cart',count);
    $.ajax({
        url: "/changeQuantity",
        data:{id:prodId,cartId:cartId},
        method: 'post',
        success: (response)=>{
            alert(response)
        }
    })
}

