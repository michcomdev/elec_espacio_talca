let internals = {
    productData: []
}

$(document).ready(async function () {
    await getProducts()
    productsInfo()
})

window.onresize = () => {
    productsInfo()
}

async function getProducts() {
    internals.productData = await axios.get('api/products')

    // console.log('productos', productData.data);
}

async function productsInfo() {
    console.log();
    if (window.innerWidth < '820') {
        document.querySelector('#contProducts').innerHTML = internals.productData.data.reduce((acc, el, i) => {
            let auxCart = JSON.parse(localStorage.getItem('cartIn')) || []
            let iconCart = ''

            if (auxCart.includes(el._id)) {
                iconCart = '<i style="font-size:20px;"  class="fas fa-trash"></i>'
            } else {
                iconCart = '<i style="font-size:20px;"  class="fas fa-cart-plus"></i>'
            }
            acc += `
            <div class="animate__animated animate__fadeIn card bg-dark text-white shadow-0" style="margin-top:10px; border-radius:10px; width:200px; margin-left:10px; ">
                <div class="bg-image hover-overlay ripple" data-mdb-ripple-color="primary" style="padding: 20px;">
                   <center><img src="${el.image}" style="margin:0 auto;  border-radius:10px; position:relative; width:100%; max-height:200px; min-height:200px; max-width:200px; margin-top:10px" class="img-fluid"/></center>
                </div>
                <div class="card-body">
                    <center><h5 class="card-title">${el.name}</h5></center>
                    <center><p class="card-text">${el.description}</p></center>
                </div>
                <div style="bottom: 20px;" class="card-footer">
                    <u style="text-decoration: none;">$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
                    <button type="button" id="cartButton" class="btn btn-success cartButton" data-productid="${el._id}" style="float:right">
                        ${iconCart}
                    </button>
                </div>
            </div>
          `
            return acc
        }, '')
    } else {
        document.querySelector('#contProducts').innerHTML = internals.productData.data.reduce((acc, el, i) => {
            let auxCart = JSON.parse(localStorage.getItem('cartIn')) || []
            let iconCart = ''
            if (auxCart.some(e => e._id === el._id)) {
                iconCart = '<i style="font-size:20px;"  class="fas fa-trash"></i>'
            } else {
                iconCart = '<i style="font-size:20px;" class="fas fa-cart-plus"></i>'
            }
            acc += /*html*/`
            <div class="animate__animated animate__fadeIn card bg-dark text-white col-md-2" style="margin-top:10px; border-radius:10px; min-width: 200px; margin-left: 10px; ">
                <div class="bg-image hover-overlay ripple" data-mdb-ripple-color="primary">
                   <center><img src=${el.image} style="margin:0 auto;  border-radius:10px; background-size:cover; position:relative; width:100%; min-height:200px; max-height:200px; max-width:200px; margin-top:10px" class="img-fluid"/></center> 
                </div>
                <div class="card-body">
                    <center><h5 style="font-weight:bold;" class="card-title">${el.name}</h5></center>
                    <center><p class="card-text">${el.description}</p></center>
                </div>
                <div class="card-footer">
                    <u style="text-decoration: none;">$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
                    <button type="button" id="cartButton" class="btn btn-success cartButton" data-productid="${el._id}" style="float:right">
                        ${iconCart}
                    </button>
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



    Array.from(querySelectorAll('.cartButton')).forEach(el => {
        el.addEventListener('click', () => {
            console.log(this);
            let productData = internals.productData.data.find(elProd => elProd._id === el.dataset.productid)
            cartlist(productData, el)
        })
    })
}

function cartlist(product, esto) {
    let cartList = JSON.parse(localStorage.getItem('cartIn')) || []
    if (esto.innerHTML.includes("trash")) {
        esto.innerHTML = "<i style= \"font-size:20px; \"  class=\"fas fa-cart-plus\"></i>"
        cartList = cartList.filter(e => e._id !== product._id);
        localStorage.setItem('cartIn', JSON.stringify(cartList))
    } else {
        product.qty = 1
        cartList.push(product)
        esto.innerHTML = "<i style= \"font-size:20px; \"  class=\"fas fa-trash\"></i>"
        localStorage.setItem('cartIn', JSON.stringify(cartList))
    }
}