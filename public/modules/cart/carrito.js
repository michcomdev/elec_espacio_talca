let internals = {
    productData: []
}

$(document).ready(async function () {
    getCarrito()
})

async function getCarrito() {
    let cartList = JSON.parse(localStorage.getItem('cartIn')) || []

    document.querySelector('#contProducts').innerHTML = /*html*/`
    <div class="row">
        <div id="cartProds" class="col-7"></div>
        <div class="col-1"></div>
        <div style="margin-top:10px; border-radius:10px;" id="buyData" class="col-4 bg-dark text-white">
            <div style="margin-top:20px;">
                <h5>Precio final:</h5>
                <br>
                <div class="row">
                    <div style="display: flex; margin-top:15px; justify-content: space-between;">
                        <label>Producto x1</label> <label>$100.000</label>
                    </div>
                   
                    <div style="display: flex; margin-top:15px; justify-content: space-between;">
                        <label>Producto x1</label> <label>$100.000</label>
                    </div>
               
                    <div style="display: flex; margin-top:15px; margin-bottom:15px; justify-content: space-between;">
                        <label>Producto x1</label> <label>$100.000</label>
                    </div>
                    <hr>
                    <div style="display: flex; margin-top:15px; justify-content: space-between;">
                        <label>Total:</label><label style="font-weight:800;">$300.000</label>
                    </div>
                    <br>
                    <br>
                    <br>
                    <center><button style="width:20vw; border-radius:10px; font-size:20px;" class="btn btn-success">
                        <i style="font-size: 20px;" class="	fa fa-money"> Ir al pago</i>
                    </button></center>
                </div>
            </div>
        </div>
    </div>
    `

    document.querySelector('#cartProds').innerHTML = cartList.reduce((acc, el, i) => {
        let auxCart = JSON.parse(localStorage.getItem('cartIn')) || []
        let iconCart = ''

        if (auxCart.some(e => e._id === el._id)) {
            iconCart = '<i style="font-size:18px;" class="fas fa-cart-arrow-down"> Remover</i>'
        } else {
            iconCart = '<i class="fas fa-cart-plus"></i>'
        }

        acc += /*html*/   `
        <div class="row bg-dark text-white" style="margin-top:10px; border-radius:10px;">
            <div style="border-radius:10px;" class="col-8 bg-dark text-white">
                <div class="bg-image col-4">
                    <img src="${el.image}" style="margin:0 auto; border-radius:10px; position:relative; width:100%; min-height:160px; max-height:160px; min-width:160px; max-width:160px; margin-top:20px; margin-left:10px;" class="img-fluid"/>
                </div>
                <div class="card-body" style="padding-left:10px;">
                    <h5 class="card-title">${el.name}</h5>
                    <p class="card-text">${el.description}</p>
                </div>
                <div>
                    <div style="width:100px;" class="quantity">
                    <input type="number" min="1" step="1" value="1">
                </div>
                    <button type="button" id="cartButton" class="btn btn-success cartButton" data-productid="${el._id}" style="float:right">
                        ${iconCart}
                    </button>
                </div>
                <br>
            </div>
            <div style="margin-top:20px;" class="col-4">
                <p>Precio unidad:</p>
                <u style="text-decoration:none;  margin-top:30px;">$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
                <p style="margin-top:30px;">Precio total:</p>
                <u style="text-decoration:none;  margin-top:20px;">$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
            </div>
        </div>
      `
        return acc
    }, '')

    $(document).ready(function () {
        jQuery('<div class="quantity-nav"><button class="quantity-button quantity-up">&#xf106;</button><button class="quantity-button quantity-down">&#xf107</button></div>').insertAfter('.quantity input');
        jQuery('.quantity').each(function () {
            var spinner = jQuery(this),
                input = spinner.find('input[type="number"]'),
                btnUp = spinner.find('.quantity-up'),
                btnDown = spinner.find('.quantity-down'),
                min = input.attr('min'),
                max = input.attr('max');

            btnUp.click(function () {
                var oldValue = parseFloat(input.val());
                if (oldValue >= max) {
                    var newVal = oldValue;
                } else {
                    var newVal = oldValue + 1;
                }
                spinner.find("input").val(newVal);
                spinner.find("input").trigger("change");
            });

            btnDown.click(function () {
                var oldValue = parseFloat(input.val());
                if (oldValue <= min) {
                    var newVal = oldValue;
                } else {
                    var newVal = oldValue - 1;
                }
                spinner.find("input").val(newVal);
                spinner.find("input").trigger("change");
            });

        });
    });
}