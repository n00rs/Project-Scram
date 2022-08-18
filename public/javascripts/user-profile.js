
    function imgPreview(event) {
        document.getElementById('imageUser').src = URL.createObjectURL(event.target.files[0])
    }

    $("#nameUpdate").click(() => {
        $("#updateName").toggle();
    })

    $("#updateName").validate({
        errorClass: 'signupError',

        rules: {
            firstName: {
                lettersonly: true,
                required: true,
                minlength: 3,
                maxlength: 15
            },
            lastName: {
                required: true,
                maxlength: 15
            },
        },
        messages: {
            firstName: {
                required: "Enter first name",
                minlength: "Enter atleast 3 characters",
                maxlength: "Not more than 8 characters"
            },
            lastName: {
                required: "Enter second name",
                maxlenth: "not more than 8 characters"
            },
        },

        submitHandler: function (form) {
            $.ajax({
                url: "/profile/update-name",
                data: $(form).serialize(),
                method: 'PUT',
                success: (result) => {
                    if (result.status)
                        $("#name").load(location.href + " #name");
                    else
                        swal({ title: "oops somthing went wrong" })
                }
            })
        }
    })

    $('#updatePhone').click(function () {
        $("#verifyPhone").toggle();
    })

    $('#verifyPhone').validate({
        errorClass: 'signupError',

        rules: {
            phone: {
                required: true,
                phoneIN: true,
            }
        },
        messages: {
            phone: {
                required: "Please enter your number",
            }
        }
    })

    jQuery.validator.addMethod('phoneIN', function (phone_number, element) {

        return this.optional(element) || phone_number.length >= 13 &&
            phone_number.match(/^((\+91[0-9]{10}))$/) ;
    }, 'Please enter a valid mobile number starts with +91 and no space');

    //$("#add-address").click(() => $("#profile-address").toggle())
    $("#profile-address").validate({
        errorClass: 'signupError',
        rules: {
            building_name: {
                required: true,
                minlength: 3,
                maxlength: 25,
            },
            street: {
                required: true,
                minlength: 3,
                maxlength: 25
            },
            city: {
                required: true,
                alphanumeric: true,
            },
            country: {
                required: true,
                lettersonly: true,
                maxlength: 25,
            },
            pincode: {
                required: true,
                digits: true,
                maxlength: 10,
                minlength: 3,
            },
            altPhone: {
                digits:true,
                maxlength:14,
            }
        },

        messages: {
            building_name: {
                required: "please enter your address",
                maxlength: "please enter rest in next field",
            },
            street: {
                required: "please enter your street details",
                maxlength: "please enter rest in next field",
            },
            city: {
                required: "please enter your city",
            },
            country: {
                required: "please enter your city details",
                maxlength: "please enter a valid country name or type short hand",
            },
            pincode: {
                required: "please enter your picode",
                digits: "enter a valid pin",
                maxlength: "please enter a valid a pincode",
                minlength: "please enter a valid a pincode",
            }
        },

        submitHandler: (form) => {

            $.ajax({
                url: "/profile/add-address",
                data: $(form).serialize(),
                method: "post",
                success: (result) => {
                    if (result.status) {
                        $("#address").load(" #address >*");
                        $("#profile-address").toggle()  
                    } else {
                        swal("oops ")
                    }
                }
            })
        }
    })

    function removeAddress(addressId, userId) {
        swal({
            title: "remove this address field ? ",
            buttons: true,
            icons: 'warning',
            closeOnClickOutside: false,

        }).then((ok) => {
            if (ok) {
                $.ajax({
                    url: "/profile/remove-address",
                    data: {
                        addressId: addressId,
                        userId: userId
                    },
                    method: 'delete',
                    success: (result) => {
                        if (result.status) {
                            $('#address').load(" #address >*")
                        } else {
                            swal({ title: "oops something went wrong ...!" })
                        }
                    }

                })
            }
        })
    }
// CONTACT US FORM SUBMISSION


    jQuery.validator.addMethod("Email", function (value, element) {
        return this.optional(element) || /^\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{1,4}\b$/i.test(value);
     }, 'Please enter a valid email address.(sample@scram.com)');
     $('#contactus-form').validate({
        errorClass: 'is-invalid',
        rules: {
           firstName: {
              required: true,
              lettersonly: true,
              minlength: 3,
              maxlength: 20
           },
           lastName: {
              required: true,
              maxlength: 20
           },
           email: {
              required: true,
              Email: true,
           },
           phone: {
              required: true,
           },
           country: {
              required: true,
           },
  
           orderNumber: {
  
           },
           language: {
              required: true,
           },
           reason: {
              required: true,
           },
           consent: {
              required: true,
           },
        },
        messages: {
           firstName: {
              required: "       please     Enter first name",
              minlength: "         please  Enter atleast 3 characters",
              maxlength: "         please Not more than 20 characters"
           },
           lastName: {
              required: "          Enter second name",
              maxlenth: "          Not more than 20 characters"
           },
           email: {
              required: "             Enter your email address",
           },
           orderNumber: {
              required: "please enter your order number"
           },
           consent:{
              required:"please agree"
           }
  
        },
        submitHandler: (form) => {
           swal({
              title: "please wait",
              closeOnClickOutside: false,
              buttons:false
          })
           $.ajax({
              url: "https://script.google.com/macros/s/AKfycbxHsh8nONCBdMAXSvktIEW4eYxe08qNPB_5Ig71f9HqYZIcdoZiQb0GwbecufFoIE8N/exec",
              method: "post",
              data: $(form).serialize(),
              success: (res) => {
                 if (res.result === 'success') {
                    swal(`your enquiry submitted we'll look into it`)
                    setTimeout(() => location.reload(), 5000)
                 } else
                    swal(`oops google is out of service let me look into it `)
  
              }
           })
        }
     })
  