
// $('#updatePhone').click(function () {
//     $("#verifyPhone").toggle();
// })
$("#add-address").click(function () {
    $("#address-form").toggle();
})


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
                    // location.reload()                 <= preferred this one has a bug

                    $("#addressCard").load(location.href + " #addressCard");        //to reload only div 
                } else {
                    swal("oops ")
                }
            }
        })
    })
})

function placeOrder() {

    body = {
        address : $('#address:checked').val(),
        couponCode:$('#couponCode').val(),
        paymentMethod : $("#paymentOption:checked").val(),
    } 

    $.ajax({
        url: '/checkout',
        data: body,
        method: 'post',
        success: (result) => {
            if(result.url) {console.log(result.url);location.href= result.url ;}
            if (result.orderPlaced) {
               location.href='/order-confirmation'
            }
            // else{
            //     swal({
            //         title:"opps something went wrong",
            //         icon: 'error'
            //     })
            // }
        }
    })
}

function checkStock(orderId,prodId,size,quantity) {
    console.log(orderId,prodId,size,quantity);
    let body = {orderId: orderId, prodId: prodId, selectedSize: size, quantity:quantity}
    $.ajax({
        url: "/admin/all-orders",
        data: body,
        method:'patch',
        success:(result)=>{
          
            result.error ? swal({ title: result.error,icon: "error" }) : 
            result.stockOut ? swal({title: result.stockOut, icon: "error"}) :
            result.orderConfirmed ? swal({title: result.orderConfirmed, icon:"success"}): 
            swal({title: "client side error"})
        }
    })
}

function updateOrderStatus(orderId,prodId,status) {
    console.log(orderId, prodId, status);
    let body = {orderId:orderId, prodId:prodId,orderStatus: status}
    $.ajax({
        url: '/admin/all-orders',
        data: body,
        method: 'put',
        success: (result) => {
console.log(result);
            if(result.success ) {
            swal({title: result.success, icon: "success"}) 
            setTimeout(()=> location.reload(),2000) 
            }
            else if(result.fail ) {
                ({title: result.fail, icon: "error"})
                 setTimeout(()=> swal.close(),2000) 
            }

            if(result.error) swal({ title: result.error,icon: "error" })
             
        }

    })
}




