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
                iconCart = '<i class="fas fa-cart-arrow-down"> Quitar</i>'
            } else {
                iconCart = '<i class="fas fa-cart-plus"></i>'
            }
            acc += `
            <div class="card border bg-dark text-white border-primary shadow-0" style="margin-top:10px; width:200px">
                <div class="bg-image hover-overlay ripple" data-mdb-ripple-color="primary">
                    <img src="${el.image}" style="margin:0 auto; position:relative; width:100%; max-height:200px; max-width:200px; margin-top:10px" class="img-fluid"/>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${el.name}</h5>
                    <p class="card-text">${el.description}</p>
                </div>
                <div class="card-footer">
                    <u>$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
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
                iconCart = '<i class="fas fa-cart-arrow-down"> Quitar</i>'
            } else {
                iconCart = '<i class="fas fa-cart-plus"></i>'
            }

            acc += /*html*/`
            <div class="card border bg-dark text-white border-primary shadow-0 col-md-3" style="margin-top:10px">
                <div class="bg-image hover-overlay ripple" data-mdb-ripple-color="primary">
                    <img src="${el.image}" style="margin:0 auto; position:relative; width:100%; max-height:200px; max-width:200px; margin-top:10px" class="img-fluid"/>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${el.name}</h5>
                    <p class="card-text">${el.description}</p>

                </div>
                <div class="card-footer">
                    <u>$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
                    <button type="button" id="cartButton" class="btn btn-success cartButton" data-productid="${el._id}" style="float:right">
                        ${iconCart}
                    </button>
                </div>
            </div>
          `
            return acc
        }, '')
    }

    Array.from(querySelectorAll('.cartButton')).forEach(el => {
        el.addEventListener('click', () => {
            let productData = internals.productData.data.find(elProd=>elProd._id === el.dataset.productid)
            cartlist(productData, el)
        })
    })
}

function cartlist (product, esto) {
    let cartList = JSON.parse(localStorage.getItem('cartIn')) || []
    if (esto.innerHTML.includes("down")) {
        esto.innerHTML = "<i class=\"fas fa-cart-plus\"></i>"
        cartList = cartList.filter(e => e._id !== product._id);
        localStorage.setItem('cartIn', JSON.stringify(cartList))
    } else {
        product.qty = 1
        cartList.push(product)
        esto.innerHTML = "<i class=\"fas fa-cart-arrow-down\"> Quitar</i>"
        localStorage.setItem('cartIn', JSON.stringify(cartList))
    }
}