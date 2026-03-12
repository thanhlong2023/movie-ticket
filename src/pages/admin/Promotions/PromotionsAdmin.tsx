import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useConfirm } from "../../../hook/useConfirm";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import PaginationControls from "../../../components/PaginationControls";
import ButtonAdmin from "../../../components/ButtonAdmin";
import { deletePromotion, fetchPromotions } from "../../../features/promotionSlice";
import PromotionsTable from "./PromotionsTable";

const PromotionsAdmin = () => {
    const { promotions, loading, error } = useAppSelector((state) => state.promotions);
    const confirm = useConfirm();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchKeyword = searchParams.get("search") || "";
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    useEffect(() => {
        dispatch(fetchPromotions());
    }, [dispatch]);

    const filteredPromotions = promotions.filter((promotion) => {
        const matchSearch = promotion.title
            .toLowerCase()
            .includes(searchKeyword.toLowerCase());

        return matchSearch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromotions = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);

    const handleDelete = async (id: number) => {
        const promotionToDelete = promotions.find((promotion) => promotion.id === id);
        if (promotionToDelete) {
            const confirmed = await confirm({
                title: "Xóa khuyến mãi",
                message: "Bạn có chắc chắn muốn xóa khuyến mãi này không?",
                confirmText: "Xóa",
                cancelText: "Hủy",
            });

            if (confirmed) {
                try {
                    await dispatch(deletePromotion(id)).unwrap();
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
                <h2 className="text-start m-0 fs-3">🎁 Quản Lý Khuyến Mãi</h2>
                <ButtonAdmin
                    path={"/admin/promotions/new"}
                    title={"Thêm Khuyến Mãi Mới"}
                />
            </div>

            <div className="flex gap-3 w-100">
                <input
                    type="text"
                    className="form-control theaters-input"
                    placeholder="Nhập tên khuyến mãi..."
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
                ({filteredPromotions.length} khuyến mãi)
            </span>

            <PromotionsTable promotions={currentPromotions} handleDelete={handleDelete} />
            <PaginationControls
                currentPage={currentPage}
                totalItems={filteredPromotions.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default PromotionsAdmin;
