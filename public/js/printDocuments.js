async function printInvoice(docType,type,memberID,invoiceID,sendEmail) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = '', siiValue = 'S.I.I. - CURICO'
    if (type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    if(invoice.type==41){
        docName1 = 'BOLETA NO AFECTA O'
    }else if(invoice.type==34){
        docName1 = 'FACTURA NO AFECTA O'
    }else if(invoice.type==0){
        docName1 = ''
        docName2 = 'COMPROBANTE DE AVISO'
        siiValue = ''
    }

    let doc = new jsPDF('l', 'pt', 'letter')
    //let doc = new jsPDF('l', 'pt', [140, 251.9])
    //let doc = new jsPDF('l', 'pt', [396, 612])
    
    console.log('width', doc.internal.pageSize.getWidth())
    console.log('height', doc.internal.pageSize.getHeight())
    
    let pdfX = 20
    let pdfY = 582

    doc.setFontSize(12)
    doc.addImage(logoWallImg90, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo
    doc.addImage(logoImg90, 'PNG', 20, pdfY - 159, 60, 77)
    pdfX += 60
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX + 23, pdfY, 'left', 90)
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX + 36, pdfY, 'left', 90)
    doc.text(`Los Cristales S/N - Curicó`, pdfX + 49, pdfY, 'left', 90)

    
    pdfX = 35
    pdfY = 282
    
    doc.setDrawColor(249, 51, 6)
    doc.setLineWidth(3)
    doc.line(pdfX - 10, pdfY - 232, pdfX - 10, pdfY - 30)//Línea Superior
    doc.line(pdfX + 60, pdfY - 232, pdfX + 60, pdfY - 30)//Línea Inferior
    doc.line(pdfX - 10, pdfY - 31, pdfX + 60, pdfY - 31)//Línea Izquierda
    doc.line(pdfX - 10, pdfY - 231, pdfX + 60, pdfY - 231)//Línea Derecha
    
    pdfY -= 30
    doc.setFontSize(13)
    doc.setTextColor(249, 51, 6)
    doc.text('R.U.T: 71.569.700-9', pdfX + 5, pdfY, 'left', 90)
    doc.text(docName1, pdfX + 20, pdfY, 'left', 90)
    doc.text(docName2, pdfX + 35, pdfY, 'left', 90)

    doc.setFontType('bold')
    if(invoice.number ||  invoice.number==0){
        if(invoice.number!=0){
            doc.text('N° ' + invoice.number, pdfX + 50, pdfY, 'left', 90)
        }
    }else{
        doc.text('N° -', pdfX + 50, pdfY, 'left', 90)
    }
    doc.setFontSize(11)
    doc.text(siiValue, pdfX + 75, pdfY, 'left', 90)

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Fecha Emisión ', pdfX + 100, pdfY - 10, 'left', 90)
    doc.text('Mes de Pago ', pdfX + 113, pdfY - 10, 'left', 90)

    doc.setFontType('bold')
    doc.text(moment(invoice.date).utc().format('DD / MM / YYYY'), pdfX + 100, pdfY - 90, 'left', 90)
    doc.text(getMonthString(invoice.lectures.month) + ' / ' + invoice.lectures.year, pdfX + 113, pdfY - 90, 'left', 90)


    pdfX = 155
    pdfY = 582
    doc.setFontSize(11)
    doc.text('SOCIO N° ' + member.number, pdfX, pdfY, 'left', 90)
    doc.text('R.U.T ' + member.rut, pdfX + 12, pdfY, 'left', 90)
    doc.setFontSize(12)
    doc.text(memberName.toUpperCase(), pdfX + 24, pdfY, 'left', 90)
    let subsidyNumber = member.subsidyNumber.toString()
    while (subsidyNumber.length<11) {
        subsidyNumber = '0' + subsidyNumber
    }
    doc.setFontSize(11)
    doc.setFontType('normal')
    doc.text('MIDEPLAN ' + subsidyNumber, pdfX + 36, pdfY, 'left', 90)
    doc.text('Sector: ' + member.address.sector.name, pdfX + 36, pdfY - 300, 'left', 90)
    doc.setFontType('bold')


    pdfX += 50

    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX, pdfY - 262, 13, 265, 'F')

    pdfX += 10
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Su consumo en m3 de este mes (1m3 = 1.000 lts de agua)', pdfX, pdfY, 'left', 90)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    
    let lastInvoice, flagLastInvoice = 0
    for (let k = 0; k < lectures.length; k++) {
        if(flagLastInvoice==1){
            if (lectures[k].invoice !== undefined) {
                lastInvoice = lectures[k].invoice
                k = lectures.length
            }
        }else{
            if (lectures[k]._id == invoice.lectures._id) {
                flagLastInvoice++
            }
        }
    }

    doc.text('Lectura Mes Actual ', pdfX + 20, pdfY, 'left', 90)
    doc.text('Lectura Mes Anterior ', pdfX + 33, pdfY, 'left', 90)
    pdfXLectureNew = 0
    if(invoice.lectureNewStart!==undefined){
        doc.text('Lectura Medidor Nuevo Inicial ', pdfX + 46, pdfY, 'left', 90)
        doc.text('Lectura Medidor Nuevo Final ', pdfX + 59, pdfY, 'left', 90)
        pdfXLectureNew = 26
    }
    doc.setFontType('bold')
    doc.text('Consumo Calculado', pdfX + 46 + pdfXLectureNew, pdfY, 'left', 90)
    doc.setFontType('normal')

    doc.text('Límite Sobreconsumo (m3)', pdfX + 98, pdfY, 'left', 90)
    doc.text('Sobreconsumo (m3)', pdfX + 111, pdfY, 'left', 90)
    doc.setFontType('bold')
    doc.text('Consumo Facturado', pdfX + 124, pdfY, 'left', 90)

    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.lectureActual), pdfX + 20, pdfY - 250, 'left', 90)
    doc.text(dot_separators(invoice.lectureLast), pdfX + 33, pdfY - 250, 'left', 90)

    if(invoice.lectureNewStart!==undefined){
        doc.text(dot_separators(invoice.lectureNewStart), pdfX + 46, pdfY - 250, 'left', 90)
        doc.text(dot_separators(invoice.lectureNewEnd), pdfX + 59, pdfY - 250, 'left', 90)
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 46 + pdfXLectureNew, pdfY - 250, 'left', 90)
    doc.setFontType('normal')
    
    doc.text(dot_separators(parameters.consumptionLimit), pdfX + 98, pdfY - 250, 'left', 90)
    if(invoice.lectureResult>parameters.consumptionLimit){
        doc.text(dot_separators(invoice.lectureResult-parameters.consumptionLimit), pdfX + 111, pdfY - 250, 'left', 90)
    }else{
        doc.text("0", pdfX + 111, pdfY - 250, 'left', 90)
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 124, pdfY - 250, 'left', 90) //Consultar diferencia facturado vs calculado



    //////////////TABLA VALORES//////////////
    let value1 = 0 //Valor tributable
    let value2 = 0 //Valor no tributable
    let value3 = 0 //Saldo Anterior
    pdfY = 282
    pdfX -= 10

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX, pdfY - 262, 13, 265, 'F')
    
    pdfX += 10
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Detalle de consumos y servicios en pesos de este mes', pdfX, pdfY, 'left', 90)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Cargo Fijo', pdfX + 20, pdfY, 'left', 90)
    doc.text('Consumo Agua Potable ', pdfX + 33, pdfY, 'left', 90)
    let pdfXTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfXTemp = 13
        doc.setTextColor(249, 51, 6)
        doc.text('Subsidio (' + invoice.subsidyPercentage.toString() + '%)', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
    }
    doc.setTextColor(0, 0, 0)
    if (invoice.consumptionLimitTotal > 0) {
        pdfXTemp += 13
        doc.text('SobreConsumo', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
    }
    if(invoice.sewerage){
        pdfXTemp += 13
        doc.text('Alcantarillado', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
    }
    if(invoice.debtFine){
        pdfXTemp += 13
        doc.text('Interés por atraso', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
    }
    if(invoice.fine){ //Multa 20%
        pdfXTemp += 13
        doc.text('Recargo 20%', pdfX + 33 + pdfXTemp, pdfY, 'left', 90)
    }



    doc.setFontType('bold')
    doc.text('SubTotal Consumo Mes Tributable', pdfX + 111, pdfY, 'left', 90)

    let index = 85 + 39

    doc.setFontType('normal')
    if(invoice.agreements){
        let totalAgreement = 0
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                index += 13
                doc.setFontType('bold')
                doc.text('Otros no Tributables', pdfX + index, pdfY, 'left', 90)
                index += 13
            }
        }
    }

    doc.setFontType('bold')
    doc.text('Saldo Anterior', pdfX + index + 13, pdfY, 'left', 90)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.charge), pdfX + 20, pdfY - 250, 'left', 90)
    doc.text(dot_separators(invoice.lectureResult * invoice.meterValue), pdfX + 33, pdfY - 250, 'left', 90)

    pdfYTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.setTextColor(249, 51, 6)
        doc.text('-' + dot_separators(invoice.subsidyValue), pdfX + 33 + pdfYTemp, pdfY - 250, 'left', 90)
    }
    doc.setTextColor(0, 0, 0)

    if (invoice.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text(dot_separators(invoice.consumptionLimitTotal), pdfX + 33 + pdfYTemp, pdfY - 250, 'left', 90)
    }
    if(invoice.sewerage){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.sewerage), pdfX + 33 + pdfYTemp, pdfY - 250, 'left', 90)
    }
    if(invoice.debtFine){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.debtFine), pdfX + 33 + pdfYTemp, pdfY - 250, 'left', 90)
    }
    if(invoice.fine){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.fine), pdfX + 33 + pdfYTemp, pdfY - 250, 'left', 90)
    }

    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 111, pdfY - 250, 'left', 90)
    value1 = invoice.invoiceSubTotal

    index = 85 + 39
    
    
    doc.setFontType('normal')
    let totalAgreement = 0
    if(invoice.agreements){
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                index += 13
                doc.setFontType('bold')
                doc.text(dot_separators(totalAgreement), pdfX + index, pdfY - 250, 'left', 90)
                index += 13
                value2 = totalAgreement
            }
        }
    }

    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceDebt), pdfX + index + 13, pdfY - 250, 'left', 90)
    value3 = invoice.invoiceDebt

    //////TOTALES Y CÓDIGO SII//////
    pdfX += 50

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX + 118, pdfY - 257, 78, 260, 'F')

    doc.text('Valor Tributable', pdfX + 130, pdfY, 'left', 90)
    doc.text('Valor No Tributable', pdfX + 143, pdfY, 'left', 90)
    doc.text('Saldo Anterior', pdfX + 156, pdfY, 'left', 90)
    
    doc.text('+ $ ', pdfX + 130, pdfY - 180, 'left', 90)
    doc.text('+ $ ', pdfX + 143, pdfY - 180, 'left', 90)
    doc.text('+ $ ', pdfX + 156, pdfY - 180, 'left', 90)
    doc.text(dot_separators(value1), pdfX + 130, pdfY - 250, 'left', 90)
    doc.text(dot_separators(value2), pdfX + 143, pdfY - 250, 'left', 90)
    doc.text(dot_separators(value3), pdfX + 156, pdfY - 250, 'left', 90)
    
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL A PAGAR', pdfX + 173, pdfY, 'left', 90)
    doc.text('FECHA VENCIMIENTO', pdfX + 188, pdfY, 'left', 90)
    doc.text('= $ ', pdfX + 173, pdfY - 180, 'left', 90)
    doc.text(dot_separators(invoice.invoiceTotal), pdfX + 173, pdfY - 250, 'left', 90)
    doc.text(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'), pdfX + 188, pdfY - 250, 'left', 90)

    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)

    if(docType=='preview'){
        doc.addImage(test2DImg, 'PNG', pdfX + 220, pdfY, 260, 106, null, null, 90)
    }else if(docType=='pdf'){
        doc.setFillColor(255, 255, 255)
        doc.rect(pdfX + 220, pdfY - 257, 106, 206, 'F')
        if(invoice.seal){
            doc.addImage(invoice.seal, 'PNG', pdfX + 220, pdfY, 260, 106, null, null, 90)
        }
        if(docName2!='COMPROBANTE DE AVISO'){
            doc.text('Timbre Electrónico S.I.I. ', pdfX + 335, pdfY - 130, 'left', 90)
            doc.text(`Res. ${invoice.resolution.numero} del ${moment(invoice.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`, pdfX + 345, pdfY - 130, 'left', 90)
        }else{
            doc.text('Documento informativo, no válido como boleta', pdfX + 335, pdfY - 130, 'left', 90)
        }
    }


/*

    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Su consumo en m3 durante los últimos 13 meses fue:', pdfX, pdfY)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    pdfX += 10
    doc.line(pdfX, pdfY + 10, pdfX, pdfY + 120)//Línea Izquierda
    doc.line(pdfX, pdfY + 120, pdfX + 250, pdfY + 120)//Línea Inferior

    //DEFINICIÓN DE LECTURAS A MOSTRAR (MÁXIMO 13)
    let lastInvoices = [], flag = 0, maxValue = 0
    for (let j = 0; j < lectures.length; j++) {
        if (lectures[j]._id == invoice.lectures._id) {
            flag++
        }

        if (flag > 0 && flag <= 13) {
            flag++

            if (lectures[j].invoice !== undefined) {
                lastInvoices.push(lectures[j].invoice)
                if (lectures[j].invoice.lectureResult > maxValue) {
                    maxValue = lectures[j].invoice.lectureResult
                }
            }
        }
    }

    if(maxValue==0){
        maxValue = 1
    }
    let meterPoints = 100 / maxValue //Puntos en PDF por mt3
    
    pdfY += 25
    doc.setFontSize(7)
    doc.setFontType('normal')

    doc.setDrawColor(199, 199, 199)

    if (maxValue < 5) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        if (maxValue == 4) {
            doc.text('3', pdfX - 2, (pdfY + 2) + 25, 'right')
            doc.text('2', pdfX - 2, (pdfY + 2) + 50, 'right')
            doc.text('1', pdfX - 2, (pdfY + 2) + 77, 'right')
            doc.line(pdfX, pdfY + 25, pdfX + 250, pdfY + 25)
            doc.line(pdfX, pdfY + 50, pdfX + 250, pdfY + 50)
            doc.line(pdfX, pdfY + 75, pdfX + 250, pdfY + 75)

        } else if (maxValue == 3) {
            doc.text('2', pdfX - 2, pdfY + 34, 'right')
            doc.text('1', pdfX - 2, pdfY + 69, 'right')
            doc.line(pdfX, pdfY + 34, pdfX + 250, pdfY + 34)
            doc.line(pdfX, pdfY + 69, pdfX + 250, pdfY + 69)
        } else if (maxValue == 2) {
            doc.text('1', pdfX - 2, pdfY + 51, 'right')
            doc.line(pdfX, pdfY + 51, pdfX + 250, pdfY + 51)
        }

        pdfY += 102

    } else if (maxValue % 4 == 0) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        let min = parseInt(maxValue / 4)
        doc.text((min * 3).toString(), pdfX - 2, pdfY + (min * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, pdfY + (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, pdfY + (min * 3 * meterPoints), 'right')

        doc.line(pdfX, pdfY + (min * meterPoints), pdfX + 250, pdfY + (min * meterPoints))
        doc.line(pdfX, pdfY + (min * 2 * meterPoints), pdfX + 250, pdfY + (min * 2 * meterPoints))
        doc.line(pdfX, pdfY + (min * 3 * meterPoints), pdfX + 250, pdfY + (min * 3 * meterPoints))

        pdfY += 102

    } else {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY + (102 - (maxValue * meterPoints)), 'right')
        doc.line(pdfX, pdfY + (100 - (maxValue * meterPoints)), pdfX + 250, pdfY + (100 - (maxValue * meterPoints)))

        let min = parseInt(maxValue / 4)

        pdfY += 102

        doc.text((min * 4).toString(), pdfX - 2, (pdfY + 2) - (min * 4 * meterPoints), 'right')
        doc.text((min * 3).toString(), pdfX - 2, (pdfY + 2) - (min * 3 * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, (pdfY + 2) - (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, (pdfY + 2) - (min * meterPoints), 'right')

        doc.line(pdfX, pdfY - (min * meterPoints), pdfX + 250, pdfY - (min * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 2 * meterPoints), pdfX + 250, pdfY - (min * 2 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 3 * meterPoints), pdfX + 250, pdfY - (min * 3 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 4 * meterPoints), pdfX + 250, pdfY - (min * 4 * meterPoints))//Línea Inferior
    }

    doc.text('0', pdfX - 2, pdfY, 'right')

    //GRÁFICO DE CONSUMOS
    pdfY = 435
    pdfX = 263
    //for(let i=lastInvoices.length; i>0; i--){
    //for(let i=13; i>0; i--){ Max month test
    doc.setFontSize(8)


    for (let i = 0; i < lastInvoices.length; i++) {

        if (i == 0) {
            doc.setFillColor(23, 162, 184)
        } else {
            doc.setFillColor(82, 82, 82)
        }

        let offset = 100 - (lastInvoices[i].lectureResult * meterPoints) //Determina posición inicial respecto al máximo del gráfico
        doc.rect(pdfX, pdfY + offset, 11, 99 - offset, 'F')
        //Posición X (descendente)
        //Posición Y suma offset según lectura
        //11 = Ancho ~ 99 - offset = Largo
        doc.text(lastInvoices[i].lectureResult.toString(), pdfX + 5, pdfY + offset - 5, 'center')
        doc.text(getMonthShortString(lastInvoices[i].lectures.month), pdfX + 7, pdfY + 108, 'center')
        pdfX -= 18
    }

    pdfX = 30
    pdfY += 200
    doc.setFontSize(9)
    doc.setFontType('bold')
    //doc.text('CORTE EN TRÁMITE A PARTIR DEL DÍA: ', pdfX, pdfY)
    if(invoice.text1){
        doc.setTextColor(249, 51, 6)
        doc.text(invoice.text1, pdfX, pdfY, {maxWidth: doc.internal.pageSize.getWidth() - 10})
    }
    if(invoice.text2){
        doc.setTextColor(0, 0, 0)
        doc.text(invoice.text2, pdfX, pdfY + 12, {maxWidth: doc.internal.pageSize.getWidth() - 10})
        doc.text(invoice.text3, pdfX, pdfY + 24, {maxWidth: doc.internal.pageSize.getWidth() - 10})
    }

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)
    */
    if (sendEmail) {
        loadingHandler('stop')

        let memberMail = member.email

        let sendDTE = await Swal.fire({
            title: 'Enviar Correo',
            customClass: 'swal-wide',
            html: `<div class="container">
                <div class="row">
                    <div class="col-md-2">Correo Electrónico</div>
                    <div class="col-md-3">
                        <input id="sendEmail" type="text" placeholder="Correo electrónico" class="form-control form-control-sm border-input" value="${memberMail}">
                    </div>
                    <div class="col-md-2">Asunto</div>
                    <div class="col-md-4">
                        <input id="sendSubject" type="text" placeholder="Asunto" class="form-control form-control-sm border-input" value="Envío de Boleta Agua - Comité de Agua Los Cristales">
                    </div>
                    <div class="col-md-12">Mensaje</div>
                    <div class="col-md-12">
                        <input id="sendText" type="text" placeholder="Texto" class="form-control form-control-sm border-input">
                    </div>
                </div>
            </div>`,
            showCloseButton: true,
            showCancelButton: true,
            showConfirmButton: true,
            focusConfirm: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'/*,
            preConfirm: () => {

                console.log('preconfirm',isEmail($("#sendEmail").val()))
                if(isEmail(memberData.email)){
                    return true    
                }else{
                    toastr.success('Correo erróneo, favor revisar')
                    return false
                }
            }*/
        })
    
        if (sendDTE.value) {

            let pdf = btoa(doc.output())
            //console.log(pdf)

            try {
                loadingHandler('start')
                
                console.log($("#sendEmail").val(),$("#sendSubject").val(),$("#sendText").val())

                let sendPdfRes = await axios.post('api/sendPdf', {
                    memberID: member._id,
                    memberName: memberName,
                    memberMail: $("#sendEmail").val(),
                    memberSubject: $("#sendSubject").val(),
                    memberText: $("#sendText").val(),
                    pdf: pdf
                })

                console.log(sendPdfRes)
        
                if (sendPdfRes.statusText == 'OK') {
                    toastr.success('Email enviado correctamente.')
                    loadingHandler('stop')
                } else {
                    toastr.error('Ha ocurrido un error al enviar el email. Compruebe su email y contraseña.')
                    loadingHandler('stop')
                }
            } catch (error) {
                loadingHandler('stop')
                console.log(error)
            }
        }
    }else{
        //doc.autoPrint()
        window.open(doc.output('bloburl'), '_blank')
        //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
    }

    loadingHandler('stop')
}


async function printInvoicePortrait(docType,type,memberID,invoiceID,sendEmail) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = '', docName2 = 'EXENTA ELECTRÓNICA', memberName = '', siiValue = 'S.I.I. - CURICO'
    if (type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    if(invoice.type==41){
        docName1 = 'BOLETA NO AFECTA O'
    }else if(invoice.type==34){
        docName1 = 'FACTURA NO AFECTA O'
    }else if(invoice.type==0){
        docName1 = ''
        docName2 = 'COMPROBANTE DE AVISO'
        siiValue = ''
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('l', 'pt', [140, 251.9])
    //let doc = new jsPDF('l', 'pt', [396, 612])
    
    console.log('width', doc.internal.pageSize.getWidth())
    console.log('height', doc.internal.pageSize.getHeight())
    

    let pdfX = 150
    let pdfY = 20

    doc.setFontSize(12)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 112, pdfY, 77, 60)
    pdfY += 60
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX, pdfY + 23, 'center')
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX, pdfY + 36, 'center')
    doc.text(`Los Cristales S/N - Curicó`, pdfX, pdfY + 49, 'center')


    pdfY = 35
    doc.setDrawColor(249, 51, 6)
    doc.setLineWidth(3)
    doc.line(pdfX + 209, pdfY - 10, pdfX + 411, pdfY - 10)//Línea Superior
    doc.line(pdfX + 209, pdfY + 60, pdfX + 411, pdfY + 60)//Línea Inferior
    doc.line(pdfX + 210, pdfY - 10, pdfX + 210, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 410, pdfY - 10, pdfX + 410, pdfY + 60)//Línea Derecha

    doc.setFontSize(13)
    doc.setTextColor(249, 51, 6)
    doc.text('R.U.T: 71.569.700-9', pdfX + 310, pdfY + 5, 'center')
    doc.text(docName1, pdfX + 310, pdfY + 20, 'center')
    doc.text(docName2, pdfX + 310, pdfY + 35, 'center')

    doc.setFontType('bold')
    if(invoice.number ||  invoice.number==0){
        if(invoice.number!=0){
            doc.text('N° ' + invoice.number, pdfX + 310, pdfY + 50, 'center')
        }
    }else{
        doc.text('N° -', pdfX + 310, pdfY + 50, 'center')
    }
    doc.setFontSize(11)
    doc.text(siiValue, pdfX + 310, pdfY + 75, 'center')

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Fecha Emisión ', pdfX + 220, pdfY + 100)
    doc.text('Mes de Pago ', pdfX + 220, pdfY + 113)

    doc.setFontType('bold')
    doc.text(moment(invoice.date).utc().format('DD / MM / YYYY'), pdfX + 300, pdfY + 100)
    doc.text(getMonthString(invoice.lectures.month) + ' / ' + invoice.lectures.year, pdfX + 300, pdfY + 113)


    pdfX = 30
    pdfY += 120
    doc.setFontSize(11)
    doc.text('SOCIO N° ' + member.number, pdfX, pdfY)
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 12)
    doc.setFontSize(12)
    doc.text(memberName.toUpperCase(), pdfX, pdfY + 24)
    let subsidyNumber = member.subsidyNumber.toString()
    while (subsidyNumber.length<11) {
        subsidyNumber = '0' + subsidyNumber
    }
    doc.setFontSize(11)
    doc.setFontType('normal')
    doc.text('MIDEPLAN ' + subsidyNumber, pdfX, pdfY + 36)
    doc.text('Sector: ' + member.address.sector.name, pdfX + 300, pdfY + 36)
    doc.setFontType('bold')




    pdfY += 60


    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Su consumo en m3 de este mes (1m3 = 1.000 lts de agua)', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    
    let lastInvoice, flagLastInvoice = 0
    for (let k = 0; k < lectures.length; k++) {
        if(flagLastInvoice==1){
            if (lectures[k].invoice !== undefined) {
                lastInvoice = lectures[k].invoice
                k = lectures.length
            }
        }else{
            if (lectures[k]._id == invoice.lectures._id) {
                flagLastInvoice++
            }
        }
    }

    //doc.text('Lectura Mes Actual ' + moment(invoice.date).utc().format('DD/MM/YYYY'), pdfX, pdfY + 20)
    //doc.text('Lectura Mes Anterior ' + ((lastInvoice) ? moment(lastInvoice.date).utc().format('DD/MM/YYYY') : ''), pdfX, pdfY + 33)
    doc.text('Lectura Mes Actual ', pdfX, pdfY + 20)
    doc.text('Lectura Mes Anterior ', pdfX, pdfY + 33)
    pdfYLectureNew = 0
    if(invoice.lectureNewStart!==undefined){
        doc.text('Lectura Medidor Nuevo Inicial ', pdfX, pdfY + 46)
        doc.text('Lectura Medidor Nuevo Final ', pdfX, pdfY + 59)
        pdfYLectureNew = 26
    }
    doc.setFontType('bold')
    doc.text('Consumo Calculado', pdfX, pdfY + 46 + pdfYLectureNew)
    doc.setFontType('normal')

    doc.text('Límite Sobreconsumo (m3)', pdfX, pdfY + 98)
    doc.text('Sobreconsumo (m3)', pdfX, pdfY + 111)
    doc.setFontType('bold')
    doc.text('Consumo Facturado', pdfX, pdfY + 124)


    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.lectureActual), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureLast), pdfX + 250, pdfY + 33, 'right')

    if(invoice.lectureNewStart!==undefined){
        doc.text(dot_separators(invoice.lectureNewStart), pdfX + 250, pdfY + 46, 'right')
        doc.text(dot_separators(invoice.lectureNewEnd), pdfX + 250, pdfY + 59, 'right')
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 46 + pdfYLectureNew, 'right')
    doc.setFontType('normal')
    
    doc.text(dot_separators(parameters.consumptionLimit), pdfX + 250, pdfY + 98, 'right')
    if(invoice.lectureResult>parameters.consumptionLimit){
        doc.text(dot_separators(invoice.lectureResult-parameters.consumptionLimit), pdfX + 250, pdfY + 111, 'right')
    }else{
        doc.text("0", pdfX + 250, pdfY + 111, 'right')
    }
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.lectureResult), pdfX + 250, pdfY + 124, 'right') //Consultar diferencia facturado vs calculado



    //////////////TABLA VALORES//////////////
    let value1 = 0 //Valor tributable
    let value2 = 0 //Valor no tributable
    let value3 = 0 //Saldo Anterior
    pdfX += 300

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, 265, 13, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('Detalle de consumos y servicios en pesos de este mes', pdfX, pdfY)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    doc.text('Cargo Fijo', pdfX, pdfY + 20)
    doc.text('Consumo Agua Potable ', pdfX, pdfY + 33)
    let pdfYTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.setTextColor(249, 51, 6)
        doc.text('Subsidio (' + invoice.subsidyPercentage.toString() + '%)', pdfX, pdfY + 33 + pdfYTemp)
    }
    doc.setTextColor(0, 0, 0)
    if (invoice.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text('SobreConsumo', pdfX, pdfY + 33 + pdfYTemp)
    }
    if(invoice.sewerage){
        pdfYTemp += 13
        doc.text('Alcantarillado', pdfX, pdfY + 33 + pdfYTemp)
    }
    if(invoice.debtFine){
        pdfYTemp += 13
        doc.text('Interés por atraso', pdfX, pdfY + 33 + pdfYTemp)
    }
    if(invoice.fine){ //Multa 20%
        pdfYTemp += 13
        doc.text('Recargo 20%', pdfX, pdfY + 33 + pdfYTemp)
    }



    doc.setFontType('bold')
    doc.text('SubTotal Consumo Mes Tributable', pdfX, pdfY + 111)

    let index = 85 + 39

    doc.setFontType('normal')
    if(invoice.agreements){
        let totalAgreement = 0
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                //doc.text('Otros', pdfX, pdfY + index)
                index += 13
                doc.setFontType('bold')
                doc.text('Otros no Tributables', pdfX, pdfY + index)
                index += 13
            }
        }
    }

    //doc.setFontType('bold')
    //doc.text('SubTotal', pdfX, pdfY + index)
    doc.setFontType('bold')
    doc.text('Saldo Anterior', pdfX, pdfY + index + 13)
    //doc.text('Monto Total', pdfX, pdfY + index + 26)

    doc.setFontSize(10)
    doc.setFontType('normal')

    doc.text(dot_separators(invoice.charge), pdfX + 250, pdfY + 20, 'right')
    doc.text(dot_separators(invoice.lectureResult * invoice.meterValue), pdfX + 250, pdfY + 33, 'right')

    pdfYTemp = 0
    if (invoice.subsidyPercentage > 0) {
        pdfYTemp = 13
        doc.setTextColor(249, 51, 6)
        doc.text('-' + dot_separators(invoice.subsidyValue), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    doc.setTextColor(0, 0, 0)

    if (invoice.consumptionLimitTotal > 0) {
        pdfYTemp += 13
        doc.text(dot_separators(invoice.consumptionLimitTotal), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    if(invoice.sewerage){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.sewerage), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    if(invoice.debtFine){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.debtFine), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }
    if(invoice.fine){
        pdfYTemp += 13
        doc.text(dot_separators(invoice.fine), pdfX + 250, pdfY + 33 + pdfYTemp, 'right')
    }

    doc.setFontType('bold')
    //doc.text(dot_separators(invoice.consumption), pdfX + 250, pdfY + 111, 'right')
    //value1 = invoice.consumption
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 250, pdfY + 111, 'right')
    value1 = invoice.invoiceSubTotal

    index = 85 + 39
    
    
    doc.setFontType('normal')
    let totalAgreement = 0
    if(invoice.agreements){
        for(let i=0; i<invoice.agreements.length; i++){
            totalAgreement += parseInt(invoice.agreements[i].amount)
            if(i+1==invoice.agreements.length && totalAgreement > 0){
                //doc.text(dot_separators(totalAgreement), pdfX + 250, pdfY + index, 'right')
                index += 13
                doc.setFontType('bold')
                doc.text(dot_separators(totalAgreement), pdfX + 250, pdfY + index, 'right')
                index += 13
                value2 = totalAgreement
            }
        }
    }

    //doc.setFontType('bold')
    //doc.text(dot_separators(parseInt(invoice.invoiceSubTotal) + parseInt(totalAgreement)), pdfX + 250, pdfY + index, 'right')
    doc.setFontType('bold')
    doc.text(dot_separators(invoice.invoiceDebt), pdfX + 250, pdfY + index + 13, 'right')
    value3 = invoice.invoiceDebt
    //doc.text(dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + index + 26, 'right')


    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 118, 260, 78, 'F')

    doc.text('Valor Tributable', pdfX, pdfY + 130)
    doc.text('Valor No Tributable', pdfX, pdfY + 143)
    doc.text('Saldo Anterior', pdfX, pdfY + 156)
    doc.text('+ $ ', pdfX + 180, pdfY + 130, 'center')
    doc.text('+ $ ', pdfX + 180, pdfY + 143, 'center')
    doc.text('+ $ ', pdfX + 180, pdfY + 156, 'center')
    doc.text(dot_separators(value1), pdfX + 250, pdfY + 130, 'right')
    doc.text(dot_separators(value2), pdfX + 250, pdfY + 143, 'right')
    doc.text(dot_separators(value3), pdfX + 250, pdfY + 156, 'right')
    
    doc.setFontSize(12)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL A PAGAR', pdfX, pdfY + 173)
    doc.text('FECHA VENCIMIENTO', pdfX, pdfY + 188)
    doc.text('= $ ', pdfX + 180, pdfY + 173, 'center')
    doc.text(dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 173, 'right')
    doc.text(moment(invoice.dateExpire).utc().format('DD/MM/YYYY'), pdfX + 250, pdfY + 188, 'right')

    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)

    if(docType=='preview'){
        doc.addImage(test2DImg, 'PNG', pdfX, pdfY + 220, 260, 106)
    }else if(docType=='pdf'){
        doc.setFillColor(255, 255, 255)
        doc.rect(pdfX, pdfY + 220, 260, 106, 'F')
        if(invoice.seal){
            doc.addImage(invoice.seal, 'PNG', pdfX, pdfY + 220, 260, 106)
        }
        if(docName2!='COMPROBANTE DE AVISO'){
            doc.text('Timbre Electrónico S.I.I. ', pdfX + 130, pdfY + 335, 'center')
            doc.text(`Res. ${invoice.resolution.numero} del ${moment(invoice.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`, pdfX + 130, pdfY + 345, 'center')
        }else{
            doc.text('Documento informativo, no válido como boleta', pdfX + 130, pdfY + 335, 'center')
        }
    }


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Su consumo en m3 durante los últimos 13 meses fue:', pdfX, pdfY)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    pdfX += 10
    doc.line(pdfX, pdfY + 10, pdfX, pdfY + 120)//Línea Izquierda
    doc.line(pdfX, pdfY + 120, pdfX + 250, pdfY + 120)//Línea Inferior

    //DEFINICIÓN DE LECTURAS A MOSTRAR (MÁXIMO 13)
    let lastInvoices = [], flag = 0, maxValue = 0
    for (let j = 0; j < lectures.length; j++) {
        if (lectures[j]._id == invoice.lectures._id) {
            flag++
        }

        if (flag > 0 && flag <= 13) {
            flag++

            if (lectures[j].invoice !== undefined) {
                lastInvoices.push(lectures[j].invoice)
                if (lectures[j].invoice.lectureResult > maxValue) {
                    maxValue = lectures[j].invoice.lectureResult
                }
            }
        }
    }

    if(maxValue==0){
        maxValue = 1
    }
    let meterPoints = 100 / maxValue //Puntos en PDF por mt3
    
    pdfY += 25
    doc.setFontSize(7)
    doc.setFontType('normal')

    doc.setDrawColor(199, 199, 199)

    if (maxValue < 5) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        if (maxValue == 4) {
            doc.text('3', pdfX - 2, (pdfY + 2) + 25, 'right')
            doc.text('2', pdfX - 2, (pdfY + 2) + 50, 'right')
            doc.text('1', pdfX - 2, (pdfY + 2) + 77, 'right')
            doc.line(pdfX, pdfY + 25, pdfX + 250, pdfY + 25)
            doc.line(pdfX, pdfY + 50, pdfX + 250, pdfY + 50)
            doc.line(pdfX, pdfY + 75, pdfX + 250, pdfY + 75)

        } else if (maxValue == 3) {
            doc.text('2', pdfX - 2, pdfY + 34, 'right')
            doc.text('1', pdfX - 2, pdfY + 69, 'right')
            doc.line(pdfX, pdfY + 34, pdfX + 250, pdfY + 34)
            doc.line(pdfX, pdfY + 69, pdfX + 250, pdfY + 69)
        } else if (maxValue == 2) {
            doc.text('1', pdfX - 2, pdfY + 51, 'right')
            doc.line(pdfX, pdfY + 51, pdfX + 250, pdfY + 51)
        }

        pdfY += 102

    } else if (maxValue % 4 == 0) {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY, 'right')
        doc.line(pdfX, pdfY, pdfX + 250, pdfY)

        let min = parseInt(maxValue / 4)
        doc.text((min * 3).toString(), pdfX - 2, pdfY + (min * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, pdfY + (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, pdfY + (min * 3 * meterPoints), 'right')

        doc.line(pdfX, pdfY + (min * meterPoints), pdfX + 250, pdfY + (min * meterPoints))
        doc.line(pdfX, pdfY + (min * 2 * meterPoints), pdfX + 250, pdfY + (min * 2 * meterPoints))
        doc.line(pdfX, pdfY + (min * 3 * meterPoints), pdfX + 250, pdfY + (min * 3 * meterPoints))

        pdfY += 102

    } else {
        pdfY -= 5
        //Línea límite según lectura máxima
        doc.text(maxValue.toString(), pdfX - 2, pdfY + (102 - (maxValue * meterPoints)), 'right')
        doc.line(pdfX, pdfY + (100 - (maxValue * meterPoints)), pdfX + 250, pdfY + (100 - (maxValue * meterPoints)))

        let min = parseInt(maxValue / 4)

        pdfY += 102

        doc.text((min * 4).toString(), pdfX - 2, (pdfY + 2) - (min * 4 * meterPoints), 'right')
        doc.text((min * 3).toString(), pdfX - 2, (pdfY + 2) - (min * 3 * meterPoints), 'right')
        doc.text((min * 2).toString(), pdfX - 2, (pdfY + 2) - (min * 2 * meterPoints), 'right')
        doc.text((min).toString(), pdfX - 2, (pdfY + 2) - (min * meterPoints), 'right')

        doc.line(pdfX, pdfY - (min * meterPoints), pdfX + 250, pdfY - (min * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 2 * meterPoints), pdfX + 250, pdfY - (min * 2 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 3 * meterPoints), pdfX + 250, pdfY - (min * 3 * meterPoints))//Línea Inferior
        doc.line(pdfX, pdfY - (min * 4 * meterPoints), pdfX + 250, pdfY - (min * 4 * meterPoints))//Línea Inferior
    }

    doc.text('0', pdfX - 2, pdfY, 'right')

    //GRÁFICO DE CONSUMOS
    pdfY = 435
    pdfX = 263
    //for(let i=lastInvoices.length; i>0; i--){
    //for(let i=13; i>0; i--){ Max month test
    doc.setFontSize(8)


    for (let i = 0; i < lastInvoices.length; i++) {

        if (i == 0) {
            doc.setFillColor(23, 162, 184)
        } else {
            doc.setFillColor(82, 82, 82)
        }

        let offset = 100 - (lastInvoices[i].lectureResult * meterPoints) //Determina posición inicial respecto al máximo del gráfico
        doc.rect(pdfX, pdfY + offset, 11, 99 - offset, 'F')
        //Posición X (descendente)
        //Posición Y suma offset según lectura
        //11 = Ancho ~ 99 - offset = Largo
        doc.text(lastInvoices[i].lectureResult.toString(), pdfX + 5, pdfY + offset - 5, 'center')
        doc.text(getMonthShortString(lastInvoices[i].lectures.month), pdfX + 7, pdfY + 108, 'center')
        pdfX -= 18
    }

    pdfX = 30
    pdfY += 200
    doc.setFontSize(9)
    doc.setFontType('bold')
    //doc.text('CORTE EN TRÁMITE A PARTIR DEL DÍA: ', pdfX, pdfY)
    if(invoice.text1){
        doc.setTextColor(249, 51, 6)
        doc.text(invoice.text1, pdfX, pdfY, {maxWidth: doc.internal.pageSize.getWidth() - 10})
    }
    if(invoice.text2){
        doc.setTextColor(0, 0, 0)
        doc.text(invoice.text2, pdfX, pdfY + 12, {maxWidth: doc.internal.pageSize.getWidth() - 10})
        doc.text(invoice.text3, pdfX, pdfY + 24, {maxWidth: doc.internal.pageSize.getWidth() - 10})
    }

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)
    
    if (sendEmail) {
        loadingHandler('stop')

        let memberMail = member.email

        let sendDTE = await Swal.fire({
            title: 'Enviar Correo',
            customClass: 'swal-wide',
            html: `<div class="container">
                <div class="row">
                    <div class="col-md-2">Correo Electrónico</div>
                    <div class="col-md-3">
                        <input id="sendEmail" type="text" placeholder="Correo electrónico" class="form-control form-control-sm border-input" value="${memberMail}">
                    </div>
                    <div class="col-md-2">Asunto</div>
                    <div class="col-md-4">
                        <input id="sendSubject" type="text" placeholder="Asunto" class="form-control form-control-sm border-input" value="Envío de Boleta Agua - Comité de Agua Los Cristales">
                    </div>
                    <div class="col-md-12">Mensaje</div>
                    <div class="col-md-12">
                        <input id="sendText" type="text" placeholder="Texto" class="form-control form-control-sm border-input">
                    </div>
                </div>
            </div>`,
            showCloseButton: true,
            showCancelButton: true,
            showConfirmButton: true,
            focusConfirm: false,
            confirmButtonText: 'Aceptar',
            cancelButtonText: 'Cancelar'/*,
            preConfirm: () => {

                console.log('preconfirm',isEmail($("#sendEmail").val()))
                if(isEmail(memberData.email)){
                    return true    
                }else{
                    toastr.success('Correo erróneo, favor revisar')
                    return false
                }
            }*/
        })
    
        if (sendDTE.value) {

            let pdf = btoa(doc.output())
            //console.log(pdf)

            try {
                loadingHandler('start')
                
                console.log($("#sendEmail").val(),$("#sendSubject").val(),$("#sendText").val())

                let sendPdfRes = await axios.post('api/sendPdf', {
                    memberID: member._id,
                    memberName: memberName,
                    memberMail: $("#sendEmail").val(),
                    memberSubject: $("#sendSubject").val(),
                    memberText: $("#sendText").val(),
                    pdf: pdf
                })

                console.log(sendPdfRes)
        
                if (sendPdfRes.statusText == 'OK') {
                    toastr.success('Email enviado correctamente.')
                    loadingHandler('stop')
                } else {
                    toastr.error('Ha ocurrido un error al enviar el email. Compruebe su email y contraseña.')
                    loadingHandler('stop')
                }
            } catch (error) {
                loadingHandler('stop')
                console.log(error)
            }
        }
    }else{
        //doc.autoPrint()
        window.open(doc.output('bloburl'), '_blank')
        //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)
    }

    loadingHandler('stop')
}

async function printAnnulment(docType,type,memberID,invoiceID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let invoiceData = await axios.post('/api/invoiceSingle', { id: invoiceID })
    let invoice = invoiceData.data

    let lecturesData = await axios.post('/api/lecturesSingleMember', { member: memberID })
    let lectures = lecturesData.data

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data


    let docName1 = 'NOTA DE CRÉDITO', docName2 = 'ELECTRÓNICA', memberName = ''
    if (type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20

    doc.setFontSize(12)
    doc.addImage(logoWallImg, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight()) //Fondo

    doc.addImage(logoImg, 'PNG', 112, pdfY, 77, 60)
    pdfY += 60
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX, pdfY + 23, 'center')
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX, pdfY + 36, 'center')
    doc.text(`Los Cristales S/N - Curicó`, pdfX, pdfY + 49, 'center')


    pdfY = 35
    doc.setDrawColor(249, 51, 6)
    doc.setLineWidth(3)
    doc.line(pdfX + 209, pdfY - 10, pdfX + 411, pdfY - 10)//Línea Superior
    doc.line(pdfX + 209, pdfY + 60, pdfX + 411, pdfY + 60)//Línea Inferior
    doc.line(pdfX + 210, pdfY - 10, pdfX + 210, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 410, pdfY - 10, pdfX + 410, pdfY + 60)//Línea Derecha

    doc.setFontSize(13)
    doc.setTextColor(249, 51, 6)
    doc.text('R.U.T: 71.569.700-9', pdfX + 310, pdfY + 5, 'center')
    doc.text(docName1, pdfX + 310, pdfY + 20, 'center')
    doc.text(docName2, pdfX + 310, pdfY + 35, 'center')

    doc.setFontType('bold')
    //doc.text('N° ' + invoice.annulment.number, pdfX + 310, pdfY + 50, 'center')
    doc.text('N° 11', pdfX + 310, pdfY + 50, 'center') //NÚMERO TEST!!!

    doc.setFontSize(11)
    doc.text('S.I.I. - CURICO', pdfX + 310, pdfY + 75, 'center')

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Fecha Emisión ', pdfX + 220, pdfY + 100)
    doc.text('Mes de Pago ', pdfX + 220, pdfY + 113)

    doc.setFontType('bold')
    doc.text(moment(invoice.date).utc().format('DD / MM / YYYY'), pdfX + 300, pdfY + 100)
    doc.text(getMonthString(invoice.lectures.month) + ' / ' + invoice.lectures.year, pdfX + 300, pdfY + 113)


    pdfX = 30
    pdfY += 120
    doc.setFontSize(12)
    doc.text('SOCIO N° ' + member.number, pdfX, pdfY)
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 13)
    doc.setFontSize(13)
    doc.text(memberName.toUpperCase(), pdfX, pdfY + 28)

    pdfY += 60


    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, doc.internal.pageSize.getWidth() - 57, 14, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY)


    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)


    doc.text('Servicio de Agua', pdfX, pdfY + 25)

    pdfX += 300
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 250, pdfY + 25, 'right')
    

    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)
    doc.setFontType('bold')

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', pdfX, pdfY + 150)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 150, 'right')


    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    let net = parseInt(invoice.invoiceTotal / 1.19)
    let iva = invoice.invoiceTotal - net
    //doc.text('Datos Tributarios: ', pdfX + 100, pdfY + 180)
    //doc.text('Neto ', pdfX + 190, pdfY + 180)
    //doc.text('IVA ', pdfX + 190, pdfY + 190)
    //doc.text(dot_separators(net), pdfX + 250, pdfY + 180, 'right')
    //doc.text(dot_separators(iva), pdfX + 250, pdfY + 190, 'right')

    if(docType=='preview'){
        doc.addImage(test2DImg, 'PNG', pdfX, pdfY + 200, 260, 106)
    }else if(docType=='pdf'){
        doc.setFillColor(255, 255, 255)
        doc.rect(pdfX, pdfY + 200, 260, 106, 'F')
        if(invoice.annulment.seal){
            doc.addImage(invoice.annulment.seal, 'PNG', pdfX, pdfY + 200, 260, 106)

            doc.text('Timbre Electrónico S.I.I. ', pdfX + 130, pdfY + 320, 'center')
            doc.text(`Res. ${invoice.annulment.resolution.numero} del ${moment(invoice.annulment.resolution.fecha).format('DD-MM-YYYY')} Verifique Documento: www.sii.cl`, pdfX + 130, pdfY + 330, 'center')
        }
    }


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(pdfX, pdfY - 10, pdfX + 201, pdfY - 10)//Línea Superior
    doc.line(pdfX, pdfY + 60, pdfX + 201, pdfY + 60)//Línea Inferior
    doc.line(pdfX, pdfY - 10, pdfX, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 201, pdfY - 10, pdfX + 201, pdfY + 60)//Línea Derecha

    let docName3 = 'Factura'
    if(invoice.type==41){
        docName3 = 'Boleta'
    }
    doc.text(`Observaciones:`, pdfX + 5, pdfY)
    doc.setFontType('normal')
    doc.text(`Anulación de ${docName3} N° ${invoice.number}`, pdfX + 5, pdfY + 20)

    pdfX = 30
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setFontSize(10)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)

    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)

    loadingHandler('stop')
}

async function printVoucher(memberID,paymentID) {
    loadingHandler('start')
    
    let memberData = await axios.post('/api/memberSingle', {id: memberID})
    let member = memberData.data

    let paymentData = await axios.post('/api/paymentSingle', { id: paymentID })
    let payment = paymentData.data
    

    let parametersData = await axios.get('/api/parameters')
    let parameters = parametersData.data

    if (member.type == 'personal') {
        memberName = member.personal.name + ' ' + member.personal.lastname1 + ' ' + member.personal.lastname2
    } else {
        memberName = member.enterprise.name
    }

    let doc = new jsPDF('p', 'pt', 'letter')
    //let doc = new jsPDF('p', 'pt', [302, 451])

    let pdfX = 150
    let pdfY = 20
    doc.addImage(logoWallImg, 'PNG', doc.internal.pageSize.getWidth() / 4, 0, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2) //Fondo

    pdfX = 30
    doc.setFontSize(16)
    doc.setFontType('bold')
    doc.text(`COMPROBANTE DE PAGO`, pdfX, pdfY + 23)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(143, 143, 143)
    doc.text(`Código Interno N° ${payment._id}`, pdfX, pdfY + 38)

    pdfX = 280
    doc.addImage(logoImg, 'PNG', pdfX, pdfY, 77, 60)
    doc.setTextColor(0, 0, 0)
    doc.text(`COMITÉ DE AGUA POTABLE RURAL`, pdfX + 80, pdfY + 23)
    doc.text(`Y SERVICIOS SANITARIOS LOS CRISTALES`, pdfX + 80, pdfY + 36)
    doc.text(`Los Cristales S/N - Curicó`, pdfX + 80, pdfY + 49)

    pdfX = 30
    pdfY += 80

    doc.setDrawColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)

    doc.line(pdfX, pdfY, doc.internal.pageSize.getWidth() - 30, pdfY )//Línea Superior

    pdfY += 35
    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Socio N° ' + member.number, pdfX, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('R.U.T ' + member.rut, pdfX, pdfY + 15)
    doc.text(memberName, pdfX, pdfY + 28)
    let subsidyNumber = member.subsidyNumber.toString()
    while (subsidyNumber.length<11) {
        subsidyNumber = '0' + subsidyNumber
    }
    doc.text('MIDEPLAN ' + subsidyNumber, pdfX, pdfY + 41)

    doc.setFontSize(12)
    doc.setFontType('bold')
    doc.text('Pago',  + 300, pdfY)
    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.text('Medio de Pago: ' + payment.paymentMethod,  + 300, pdfY + 15)
    doc.text('N° Transacción: ' + payment.transaction,  + 300, pdfY + 28)
    doc.text('Fecha Pago: ' + moment(payment.date).utc().format('DD / MM / YYYY'),  + 300, pdfY + 41)

    pdfY += 60

    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY, doc.internal.pageSize.getWidth() - 57, 14, 'F')
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY + 10)
    doc.text('SUBTOTAL', pdfX + 300, pdfY + 10)
    doc.text('VALOR PAGADO', doc.internal.pageSize.getWidth() - 40, pdfY + 10, 'right')

    pdfY += 18
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    for(let i=0; i<payment.invoices.length; i++){
        pdfY += 13

        number = ''
        if(payment.invoices[i].invoices.number){
            number = `N° ${payment.invoices[i].invoices.number}`
        }

        if(payment.invoices[i].invoices.type==41){
            doc.text(`Boleta ${number} - Mes ${getMonthString(payment.invoices[i].invoices.lectureData.month)}`, pdfX, pdfY)
        }else{
            doc.text(`Factura N° ${payment.invoices[i].invoices.number} - Mes ${getMonthString(payment.invoices[i].invoices.lectureData.month)}`, pdfX, pdfY)
        }

        let agreements = 0
        if(payment.invoices[i].invoices.agreements){
            for(let j=0; j<payment.invoices[i].invoices.agreements.length; j++){
                agreements += payment.invoices[i].invoices.agreements[j].amount
            }
        }

        doc.text('$ ' + dot_separators(payment.invoices[i].invoices.invoiceSubTotal + agreements), pdfX + 300, pdfY)
        doc.text('$ ' + dot_separators(payment.invoices[i].amount), doc.internal.pageSize.getWidth() - 40, pdfY, 'right')
    }

    pdfY = 300
    
    doc.setFillColor(0, 0, 0)
    doc.rect(pdfX + 345, pdfY, 200, 15, 'F')

    doc.setFontType('bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(`Total Pagado`, pdfX + 350, pdfY + 11)
    doc.text('$ ' + dot_separators(payment.amount), doc.internal.pageSize.getWidth() - 40, pdfY + 11, 'right')


/*
    //////////////TABLA CONSUMOS//////////////
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, pdfY - 10, doc.internal.pageSize.getWidth() - 57, 14, 'F')

    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('DETALLE', pdfX, pdfY)


    doc.setFontSize(10)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)


    doc.text('Servicio de Agua', pdfX, pdfY + 25)

    pdfX += 300
    doc.text(dot_separators(invoice.invoiceSubTotal), pdfX + 250, pdfY + 25, 'right')
    

    //////TOTALES Y CÓDIGO SII//////
    pdfY += 50
    doc.setFontSize(12)
    doc.setFontType('bold')

    doc.setFillColor(23, 162, 184)
    doc.rect(pdfX - 3, pdfY + 137, 260, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL', pdfX, pdfY + 150)
    doc.text('$ ' + dot_separators(invoice.invoiceTotal), pdfX + 250, pdfY + 150, 'right')


    doc.setFontSize(8)
    doc.setFontType('normal')
    doc.setTextColor(0, 0, 0)
    let net = parseInt(invoice.invoiceTotal / 1.19)
    let iva = invoice.invoiceTotal - net


    ///////GRÁFICO CONSUMOS///////

    pdfX = 30
    pdfY += 150
    doc.setFontSize(9)
    doc.setFontType('bold')
    doc.setTextColor(0, 0, 0)


    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(1)
    doc.line(pdfX, pdfY - 10, pdfX + 201, pdfY - 10)//Línea Superior
    doc.line(pdfX, pdfY + 60, pdfX + 201, pdfY + 60)//Línea Inferior
    doc.line(pdfX, pdfY - 10, pdfX, pdfY + 60)//Línea Izquierda
    doc.line(pdfX + 201, pdfY - 10, pdfX + 201, pdfY + 60)//Línea Derecha

    let docName3 = 'Factura'
    if(invoice.type==41){
        docName3 = 'Boleta'
    }
    doc.text(`Observaciones:`, pdfX + 5, pdfY)
    doc.setFontType('normal')
    doc.text(`Anulación de ${docName3} N° ${invoice.number}`, pdfX + 5, pdfY + 20)

    pdfX = 30
    doc.setFillColor(26, 117, 187)
    doc.rect(pdfX - 3, doc.internal.pageSize.getHeight() - 60, doc.internal.pageSize.getWidth() - 57, 17, 'F')

    doc.setFontSize(10)
    doc.setFontType('bold')
    doc.setTextColor(255, 255, 255)
    doc.text('N° Teléfono oficina Comité: ' + parameters.phone + ' - Correo electrónico:  ' + parameters.email, pdfX, doc.internal.pageSize.getHeight() - 48)
*/
    //doc.autoPrint()
    window.open(doc.output('bloburl'), '_blank')
    //doc.save(`Nota de venta ${internals.newSale.number}.pdf`)

    loadingHandler('stop')
}