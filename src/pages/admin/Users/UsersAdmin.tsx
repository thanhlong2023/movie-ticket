import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchUsers, lockUser, updateUserRole } from "../../../features/usersSlice";
import { useConfirm } from "../../../hook/useConfirm";
import PaginationControls from "../../../components/PaginationControls";
import { useAuth } from "../../../contexts/AuthContext";
import { showNotification } from "../../../features/notificationSlice";
import type { User } from "../../../types";

const UsersAdmin = () => {
  const dispatch = useAppDispatch();
  const { users, loading } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const confirm = useConfirm();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = Boolean(
    currentUser && (currentUser.userName === "admin" || currentUser.email === "admin@cinema.com" || currentUser.id === 1)
  );

  const handleToggleLock = async (id: number, currentStatus?: boolean) => {
    // Prevent self-lock
    if (currentUser?.id === id) {
      dispatch(showNotification({ message: "Bạn không thể khoá tài khoản của chính mình.", type: "warning" }));
      return;
    }

    // Prevent non-super admins from locking admin accounts
    const target = users.find((u) => u.id === id);
    if (target?.role === "admin" && !isSuperAdmin) {
      dispatch(showNotification({ message: "Chỉ admin tổng mới có thể khoá tài khoản admin.", type: "danger" }));
      return;
    }

    const isActive = currentStatus === undefined ? true : !!currentStatus;
    const title = isActive ? "Khóa người dùng" : "Mở khóa người dùng";
    const message = isActive
      ? "Bạn có chắc chắn muốn khóa người dùng này? Người dùng sẽ không thể đăng nhập."
      : "Bạn có chắc chắn muốn mở khóa người dùng này? Người dùng sẽ có thể đăng nhập lại.";
    const confirmText = isActive ? "Khóa" : "Mở khóa";
    const confirmed = await confirm({
      title,
      message,
      confirmText,
      cancelText: "Hủy",
    });
    if (confirmed) {
      dispatch(lockUser({ id, status: !isActive }));
    }
  };

  const canChangeRole = (item: User) => {
    if (!currentUser) return false;
    if (currentUser.id === item.id) return false; // cannot change own role
    const newRole = item.role === "admin" ? "user" : "admin";
    // Any role change that involves admin (promote/demote) requires super admin
    if ((item.role === "admin" || newRole === "admin") && !isSuperAdmin) return false;
    return true;
  };

  const handleRoleChange = async (id: number, currentRole: "admin" | "user") => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    // Prevent self-role-change
    if (currentUser?.id === id) {
      dispatch(showNotification({ message: "Bạn không thể đổi quyền tài khoản của chính mình.", type: "warning" }));
      return;
    }

    // Only super admin can change admin roles (either promoting or demoting)
    if ((currentRole === "admin" || newRole === "admin") && !isSuperAdmin) {
      dispatch(showNotification({ message: "Chỉ admin tổng mới có quyền thay đổi quyền admin.", type: "danger" }));
      return;
    }

    const confirmed = await confirm({
      title: "Đổi quyền người dùng",
      message: `Bạn có muốn đổi quyền của user này thành ${newRole}?`,
      confirmText: "Đồng ý",
      cancelText: "Hủy",
    });
    if (confirmed) {
      dispatch(updateUserRole({ id, role: newRole }));
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-1">Quản lý Người dùng</h2>
          <p className="text-secondary m-0">
            Danh sách khách hàng và quản trị viên
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table admin-table mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email / SĐT</th>
                  <th>Vai trò</th>
                  <th>Ngày đăng ký</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-white">
                      Đang tải...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-secondary">
                      Chưa có người dùng nào.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((item: User) => (
                    <tr key={item.id}>
                      <td className="text-secondary">#{item.id}</td>
                      <td>
                        <div className="fw-bold text-white">{item.name}</div>
                      </td>
                      <td>
                        <div className="text-white">{item.email}</div>
                        <div className="text-secondary small">
                          {item.phone || "---"}
                        </div>
                      </td>
                      <td>
                        {item.role === "admin" ? (
                          <span className="badge bg-danger">Admin</span>
                        ) : (
                          <span className="badge bg-secondary">User</span>
                        )}
                      </td>
                      <td className="text-white">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("vi-VN")
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          onClick={() => handleRoleChange(item.id, item.role)}
                          className="btn btn-outline-warning btn-sm me-2"
                          title={
                            item.id === currentUser?.id
                              ? "Không thể đổi quyền chính mình"
                              : !canChangeRole(item)
                              ? "Chỉ admin tổng mới có quyền thay đổi quyền admin"
                              : "Đổi quyền Admin/User"
                          }
                          disabled={!canChangeRole(item)}
                        >
                          <i className="bi bi-shield-lock"></i>
                        </button>
                        <button
                          onClick={() => handleToggleLock(item.id, item.status)}
                          className={`btn btn-outline-${item.status ? "danger" : "success"} btn-sm`}
                          title={
                            item.id === currentUser?.id
                              ? "Không thể khoá chính mình"
                              : (item.role === "admin" && !isSuperAdmin)
                              ? "Chỉ admin tổng mới có thể khoá admin"
                              : item.status
                              ? "Khóa người dùng"
                              : "Mở khóa người dùng"
                          }
                          disabled={item.id === currentUser?.id || (item.role === "admin" && !isSuperAdmin)}
                        >
                          {item.status ? <i className="bi bi-lock"></i> : <i className="bi bi-unlock"></i>}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Pagination Controls */}
        <div className="p-3">
          <PaginationControls
            currentPage={currentPage}
            totalItems={users.length}
            pageSize={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default UsersAdmin;
