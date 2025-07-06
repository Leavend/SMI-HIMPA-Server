import { autoInjectable } from "tsyringe";
import {
  IFindInventoryQuery,
  IInventory,
  IInventoryCreationBody,
} from "../interface/inventory-interface";
import InventoryDataSource from "../datasource/inventory-datasource";
import BorrowDetailDataSource from "../datasource/borrowDetail-datasource";

/**
 * Service class for handling inventory-related operations
 */
@autoInjectable()
class InventoryService {
  constructor(
    private inventoryDataSource: InventoryDataSource,
    private borrowDetailDataSource: BorrowDetailDataSource,
  ) {}

  /**
   * Get all inventories with custom query
   * @param query - Custom query parameters
   * @returns Promise resolving to array of inventories or null
   */
  async getAllInventoriesWithQuery(
    query: IFindInventoryQuery,
  ): Promise<IInventory[] | null> {
    try {
      return await this.inventoryDataSource.fetchAll(query);
    } catch (error) {
      console.error("Error fetching inventories with query:", error);
      throw error;
    }
  }

  /**
   * Get inventory by field criteria
   * @param record - Partial inventory object to search by
   * @returns Promise resolving to inventory or null
   */
  async getInventoryByField(
    record: Partial<IInventory>,
  ): Promise<IInventory | null> {
    try {
      // Filter out Date objects and only use string/number fields
      const searchCriteria: { [key: string]: string | number } = {};
      Object.entries(record).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          searchCriteria[key] = value;
        }
      });

      const query: IFindInventoryQuery = {
        where: searchCriteria,
        raw: true,
        returning: false,
      };
      return await this.inventoryDataSource.fetchOne(query);
    } catch (error) {
      console.error("Error fetching inventory by field:", error);
      throw error;
    }
  }

  /**
   * Get all inventories ordered by creation date
   * @returns Promise resolving to array of inventories or null
   */
  async getAllInventories(): Promise<IInventory[] | null> {
    try {
      const query: IFindInventoryQuery = {
        where: {},
        raw: true,
        returning: false,
      };
      return await this.inventoryDataSource.fetchAll(query);
    } catch (error) {
      console.error("Error fetching all inventories:", error);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   * @param record - Inventory creation data
   * @returns Promise resolving to created inventory
   */
  async createInventory(record: IInventoryCreationBody): Promise<IInventory> {
    try {
      return await this.inventoryDataSource.create(record);
    } catch (error) {
      console.error("Error creating inventory:", error);
      throw error;
    }
  }

  /**
   * Update inventory record by search criteria
   * @param searchBy - Criteria to find inventory to update
   * @param record - Data to update
   * @param transaction - Optional database transaction
   * @returns Promise that resolves when update is complete
   */
  async updateInventoryRecord(
    searchBy: Partial<IInventory>,
    record: Partial<IInventory>,
    transaction?: any,
  ): Promise<void> {
    try {
      // Filter out Date objects and only use string/number fields
      const searchCriteria: { [key: string]: string | number } = {};
      Object.entries(searchBy).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          searchCriteria[key] = value;
        }
      });

      const query: IFindInventoryQuery = {
        where: searchCriteria,
        returning: false,
      };
      await this.inventoryDataSource.updateOne(query, record);
    } catch (error) {
      console.error("Error updating inventory record:", error);
      throw error;
    }
  }

  /**
   * Delete inventory by search criteria
   * @param searchBy - Criteria to find inventory to delete
   * @param cascade - Whether to delete related borrow details (default: false)
   * @returns Promise that resolves when deletion is complete
   */
  async deleteInventory(
    searchBy: Partial<IInventory>,
    cascade: boolean = false,
  ): Promise<void> {
    try {
      // Filter out Date objects and only use string/number fields
      const searchCriteria: { [key: string]: string | number } = {};
      Object.entries(searchBy).forEach(([key, value]) => {
        if (typeof value === "string" || typeof value === "number") {
          searchCriteria[key] = value;
        }
      });

      // Check if there are related borrow details
      const relatedBorrowDetails = await this.borrowDetailDataSource.fetchAll({
        where: { inventoryId: searchCriteria.inventoryId },
        raw: true,
        returning: false,
      });

      if (relatedBorrowDetails && relatedBorrowDetails.length > 0) {
        if (!cascade) {
          throw new Error(
            `Cannot delete inventory because it has ${relatedBorrowDetails.length} related borrow detail(s). ` +
              `Use cascade=true to delete related records as well.`,
          );
        }

        // If cascade is true, delete related borrow details first
        for (const borrowDetail of relatedBorrowDetails) {
          await this.borrowDetailDataSource.deleteOne({
            where: { borrowDetailId: borrowDetail.borrowDetailId },
            returning: false,
          });
        }
      }

      const query: IFindInventoryQuery = {
        where: searchCriteria,
        returning: false,
      };
      await this.inventoryDataSource.deleteOne(query);
    } catch (error) {
      console.error("Error deleting inventory:", error);
      throw error;
    }
  }
}

export default InventoryService;
