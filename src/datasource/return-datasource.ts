import {
  IFindReturnQuery,
  IReturn,
  IReturnCreationBody,
  IReturnDataSource,
} from "../interface/return-interface";
import ReturnModel from "../model/return-model";

class ReturnDataSource implements IReturnDataSource {
  // Create a new return record
  async create(record: IReturnCreationBody): Promise<IReturn> {
    return ReturnModel.create(record);
  }

  // Fetch a single return record based on search criteria
  async fetchOne(query: IFindReturnQuery): Promise<IReturn | null> {
    return ReturnModel.findOne(query);
  }

  // Fetch all return records based on search criteria
  async fetchAll(query: IFindReturnQuery): Promise<IReturn[] | null> {
    return ReturnModel.findAll(query);
  }

  // Update a single return record based on search criteria
  async updateOne(
    searchBy: IFindReturnQuery,
    data: Partial<IReturn>,
  ): Promise<void> {
    await ReturnModel.update(data, searchBy);
  }

  // Delete a single return record based on search criteria
  async deleteOne(query: IFindReturnQuery): Promise<void> {
    await ReturnModel.destroy(query);
  }
}

export default ReturnDataSource;
