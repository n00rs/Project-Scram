
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
  let address =   $('#address:checked').val() ;
//   let result = JSON.stringify(address)
let orderData = $('#orderData').val()
let payment = $("#paymentOption:checked").val();
  console.log(payment);
}
