$("#profile-address").validate({
  errorClass: "signupError",
  rules: {
    building_name: {
      required: true,
      minlength: 3,
      maxlength: 25,
    },
    street: {
      required: true,
      minlength: 3,
      maxlength: 25,
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
      digits: true,
      maxlength: 14,
    },
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
      required: "please enter your pincode",
      digits: "enter a valid pincode",
      maxlength: "please enter a valid a pincode",
      minlength: "please enter a valid a pincode",
    },
  },

  submitHandler: (form) => {
    $.ajax({
      url: "/profile/add-address",
      data: $(form).serialize(),
      method: "post",
      success: (result) => {
        if (result.status) {
          location.reload();
          $("#profile-address").toggle();
        } else {
          swal("oops ");
        }
      },
    });
  },
});

function placeOrder() {
  let address = $("#selectedAddress:checked").val();
  if (address === undefined) swal("no address");
  else {
    swal({
      title: "please wait",
      closeOnClickOutside: false,
      buttons: false,
    });
    body = {
      address: address,
      couponCode: $("#couponCode").val(),
      paymentMethod: $("#paymentOption:checked").val(),
    };

    $.ajax({
      url: "/checkout",
      data: body,
      method: "post",
      success: (result) => {
        if (result.url) {
          console.log(result.url);
          location.href = result.url;
        }

        if (result.orderPlaced) location.href = "/order-confirmation/success";
        if (result.paytm) {
          console.log(result.paytm);
          var information = {
            action: "https://securegw-stage.paytm.in/order/process",
            params: result.paytm,
          };
          post(information);
        }
        if (result.err) {
          swal(result.err);
        }
      },
    });
  }
}

function buildForm({ action, params }) {
  const form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("action", action);

  Object.keys(params).forEach((key) => {
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", key);
    input.setAttribute("value", params[key]);
    form.appendChild(input);
  });

  return form;
}

function post(details) {
  const form = buildForm(details);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function checkStock(orderId, prodId, size, quantity) {
  console.log(orderId, prodId, size, quantity);
  let body = {
    orderId: orderId,
    prodId: prodId,
    selectedSize: size,
    quantity: quantity,
  };
  $.ajax({
    url: "/admin/all-orders",
    data: body,
    method: "patch",
    success: (result) => {
      if (result.stockOut) {
        swal({
          title: result.stockOut,
          icon: "error",
          text: "mark the order as canceled ? ",
          closeOnClickOutside: false,
          buttons: true,
        }).then((ok) => {
          ok ? updateOrderStatus(orderId, prodId, "cancelled", size) : swal.close();
        });
      } else {
        result.error
          ? swal({ title: result.error, icon: "error" })
          : result.orderConfirmed
          ? $("#status").load(" #status >*")
          : swal({ title: "client side error" });
      }
    },
  });
}

function updateOrderStatus(orderId, prodId, status, size) {
  console.log(orderId, prodId, status);
  let body = { orderId: orderId, prodId: prodId, orderStatus: status, selectedSize: size };
  $.ajax({
    url: "/admin/all-orders",
    data: body,
    method: "put",
    success: (result) => {
      console.log(result);
      if (result.success) {
        swal({ title: result.success, icon: "success" });
        setTimeout(() => location.reload(), 2000);
      } else if (result.fail) {
        swal({ title: result.fail, icon: "error" });
        setTimeout(() => swal.close(), 2000);
      }
      if (result.err) swal({ title: result.err, icon: "error" });
    },
  });
}
