import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConfirm } from "../../../hook/useConfirm";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import {
  deleteFestival,
  fetchFestivals,
} from "../../../features/festivalSlice";
import FestivalTable from "./FestivalTable";
import ButtonAdmin from "../../../components/ButtonAdmin";
import PaginationControls from "../../../components/PaginationControls";

const FestivalAdmin = () => {
  const { festivals, loading, error } = useAppSelector(
    (state) => state.festivals
  );
  const confirm = useConfirm();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKeyword = searchParams.get("search") || "";
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

    useEffect(() => {
        dispatch(fetchFestivals());
    }, [dispatch]);

  const filteredFestival = festivals.filter((festival) => {
    const matchSearch = festival.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());

    return matchSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFestivals = filteredFestival.slice(
    indexOfFirstItem,
    indexOfLastItem
  );


  const handleDelete = async (id: number) => {
    const festivalToDelete = festivals.find((festival) => festival.id === id);
    if (festivalToDelete) {
      const confirmed = await confirm({
        title: "Xóa liên hoa phim",
        message: "Bạn có chắc chắn muốn xóa liên hoan phim này không?",
        confirmText: "Xóa",
        cancelText: "Hủy",
      });

      if (confirmed) {
        try {
          await dispatch(deleteFestival(id)).unwrap();
        } catch (error) {
          console.error("Delete failed", error);
        }
      }
    }
  };

  if (loading)
    return (
      <div className="bg-dark p-2 flex text-secondary fw-bold rounded-3">
        Đang tải dữ liệu...
      </div>
    );
  if (error)
    return (
      <div className="bg-dark p-2 flex text-danger fw-bold rounded-3">
        Lỗi tải dữ liệu...
      </div>
    );
  return (
    <div className="stat-card stat-custom">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-start m-0 fs-3">🎞️ Quản Lý Liên Hoan Phim</h2>
        <ButtonAdmin
          path={"/admin/festival/new"}
          title={"Thêm Liên Hoan Phim Mới"}
        />
      </div>

      <div className="flex gap-3 w-100">
        <input
          type="text"
          className="form-control theaters-input"
          placeholder="Nhập tên liên hoan phim..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchParams({
              search: e.target.value,
            });
            setCurrentPage(1);
          }}
        />
      </div>
      <span className="mt-3 flex text-secondary justify-content-end">
        ({filteredFestival.length} liên hoan phim)
      </span>

      <FestivalTable
        festivals={currentFestivals}
        handleDelete={handleDelete}
      />
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredFestival.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FestivalAdmin;
