import mongoose from "mongoose";

interface IUser {
  username: string;
  email: string;
  password: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "staff", "user"],
      default: "user",
    },
    permissions: [
      {
        type: String,
        enum: [
          "dashboard",
          "events",
          "tickets",
          "coupons",
          "transactions",
          "checkin",
          "users",
          "concluded",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  mongoose.model<IUser>("User", UserSchema);
