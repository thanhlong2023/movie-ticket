import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useConfirm } from "../../../hook/useConfirm";
import { useAppDispatch, useAppSelector } from "../../../hook/hook";
import { fetchNews, deleteNews } from "../../../features/newsSlice";
import PaginationControls from "../../../components/PaginationControls";
import ButtonAdmin from "../../../components/ButtonAdmin";
import NewsTable from "./NewsTable";

const NewsAdmin = () => {
    const { news, loading, error } = useAppSelector((state) => state.news);
    const confirm = useConfirm();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchKeyword = searchParams.get("search") || "";
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    useEffect(() => {
        dispatch(fetchNews());
    }, [dispatch]);

    const filteredNews = news.filter((n) => {
        const matchSearch = n.title
            .toLowerCase()
            .includes(searchKeyword.toLowerCase());

        return matchSearch;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

    const handleDelete = async (id: number) => {
        const newToDelete = news.find((n) => n.id === id);
        if (newToDelete) {
            const confirmed = await confirm({
                title: "Xóa sự kiện",
                message: "Bạn có chắc chắn muốn xóa sự kiện này không?",
                confirmText: "Xóa",
                cancelText: "Hủy",
            });

            if (confirmed) {
                try {
                    await dispatch(deleteNews(id)).unwrap();
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
                <h2 className="text-start m-0 fs-3">📰 Quản Lý Tin Tức</h2>
                <ButtonAdmin
                    path={"/admin/news/new"}
                    title={"Thêm Tin Tức Mới"}
                />
            </div>

            <div className="flex gap-3 w-100">
                <input
                    type="text"
                    className="form-control theaters-input"
                    placeholder="Nhập tên tin tức..."
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
                ({filteredNews.length} tin tức)
            </span>

            <NewsTable news={currentNews} handleDelete={handleDelete} />
            <PaginationControls
                currentPage={currentPage}
                totalItems={filteredNews.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default NewsAdmin;
