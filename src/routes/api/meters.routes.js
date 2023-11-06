import Joi from "joi";
import Meters from "../../models/Meters";
import Switchboards from "../../models/Switchboards";
import Type from "../../models/Types";
import dotEnv from "dotenv";
import Client from "../../models/Clients";
dotEnv.config();

export default [
  {
    method: "POST",
    path: "/api/postMeter",
    options: {
      description: "get all users data",
      notes: "return all data from users",
      tags: ["api"],
      handler: async (request, h) => {
        console.log(request.payload);
        let payload = request.payload;
        try {
          let dataQuery = {
            name: payload.name,
            address: payload.address,
            clients: payload.clients,
            serialNumber: payload.serialNumber,
          };
          const newUser = new Meters(dataQuery);
          await newUser.save();

          let switchboartId = payload.switchId;
          let member = await Switchboards.findById(switchboartId);

          member.meters.push(newUser._id);

          const response = await member.save();
          console.log("meter added", response);

          // Assuming Meters constructor returns a promise

          // If all goes well, you can return a success response here
          return { success: true };
        } catch (error) {
          console.error(error);

          // Return an error response
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  },
  {
    method: "POST",
    path: "/api/removeMeterById",
    handler: (request, h) => {
      const { switchboardId, meterId } = request.payload;

      // Encuentra el switchboard por su ID
      const switchboard = Switchboards.find((s) => s.id === switchboardId);

      if (!switchboard) {
        return { error: "Switchboard no encontrado" };
      }

      // Elimina el medidor por su ID
      const index = switchboard.meters.indexOf(meterId);
      if (index !== -1) {
        switchboard.meters.splice(index, 1);
        return { message: "Medidor eliminado con éxito" };
      } else {
        return { error: "Medidor no encontrado en el switchboard" };
      }
    },
  },
  {
    method: "POST",
    path: "/api/updateMeterById",
    options: {
      description: "Update meter data by ID",
      notes: "Update meter data and clients field by meter ID",
      tags: ["api"],
      handler: async (request, h) => {
        console.log(request.payload);
        let payload = request.payload;
        let meterData = {
          name: payload.name,
          address: payload.address,
          serialNumber: payload.serialNumber,
          clients: payload.clients, // Actualiza el campo "clients" con el valor proporcionado en la solicitud
        };
        // console.log("clienteID", meterData.clients);
        let meterId = payload.meterId;

        try {
          // console.log("Meter data:", meterData);

          const res = await Meters.findByIdAndUpdate(meterId, meterData);

          console.log("Result:", res);
          return res; // Devuelve el objeto actualizado
        } catch (error) {
          console.log(error);
          return h
            .response({
              error: "Internal Server Error",
            })
            .code(500);
        }
      },
    },
  },
];
