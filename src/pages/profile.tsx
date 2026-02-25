import React, { useState } from "react";
import { getCookies } from "../controllers/misc/cookies.controller";
import imageCompression from "browser-image-compression";
import updateUser from "../controllers/user/updateUser.controller";
import updatePassword from "../controllers/user/updatePassword.controller";
import { getOverviewData } from "../controllers/dash/overview.controller";

import AsideMenu from "../components/asideMenu";
import Footer from "../components/footer";

import "../style/profile.css";

type TUser = {
    id: number,
    firstName: string,
    lastName: string,
    birthDate: string,
    gender: string,
    profilePic: string,
    docType: string,
    docId: string,
    phone: string,
    email: string,
    language: string,
    courses: [],
    role: string,
    isActive: boolean,
    mustChangePassword?: boolean
}

type TOverviewData = {
    completedCourses: number,
    inProgressCourses: number,
    totalHours: number,
    unreadNotifications: number
}

function Profile() {
    const userData = getCookies("userData") as unknown as TUser;
    const profilePic = localStorage.getItem("profilePic");
    const [updateData, setUpdateData] = useState<TUser>({} as TUser);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [ overviewData, setOverviewData ] = useState<TOverviewData | null>(null);
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");

    function updateUserDataCookie(nextUserData: TUser) {
        document.cookie = `userData=${encodeURIComponent(JSON.stringify(nextUserData))}; path=/`;
    }

    function handleModalMessage(data: { isError: boolean; message: string }) {
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(data.isError);
        if (messageElement) {
            messageElement.textContent = data.message;
        } else {
            setMessage(data.message);
        }
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
    }

    React.useEffect(() => {
        async function fetchOverviewData() {
            try {
                const overviewData = await getOverviewData();
                setOverviewData(overviewData);
            } catch (error) {
                console.error("Error fetching overview data:", error);
            }
        }

        fetchOverviewData();
    }, [])

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const forcePassword = params.get("forcePassword");
        if (forcePassword !== "1") return;

        handleModalMessage({
            isError: true,
            message: "Por segurança, altere sua senha padrão para continuar."
        });

        const passwordSection = document.querySelector(".main-data-wrapper.password");
        if (passwordSection) {
            passwordSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, []);

    const previewImage =
        updateData.profilePic ||
        profilePic ||
        "";

    
    function formatDocId(docId: string, docType: string) {
        if (!docId) return "";

        const clean = docId.replace(/\W/g, "");

        if (docType === "cpf") {
            return clean
                .slice(0, 11)
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        }

        if (docType === "nif") {
            return clean
                .slice(0, 9)
                .replace(/^(\d{3})(\d)/, "$1 $2")
                .replace(/^(\d{3}) (\d{3})(\d)/, "$1 $2 $3");
        }

        if (docType === "passport") {
            return docId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        }

        return docId;
    }

    function setUpdatedData(event: React.ChangeEvent<any>) {
        const { name, type, files, value } = event.target;

        // Campos normais
        if (type !== "file") {
            let newValue = value;

            if (name === "docId") {
                const currentType = updateData.docType || userData.docType;
                newValue = formatDocId(value, currentType);
            }

            setUpdateData(prev => ({
                ...prev,
                [name]: newValue
            }));

            return;
        }

        // Upload de imagem
        if (files && files[0]) {
            const file = files[0];

            imageCompression(file, {
                maxSizeMB: 0.7,
                maxWidthOrHeight: 900,
                initialQuality: 0.7,
                alwaysKeepResolution: false,
                useWebWorker: true,
                fileType: "image/jpeg"
            }).then(async (compressedFile) => {
                const reader = new FileReader();

                reader.onload = () => {
                    let base64 = reader.result as string;
                    base64 = base64.replace(/^data:image\/[a-z]+;base64,/, "");

                    setUpdateData(prev => ({
                        ...prev,
                        profilePic: `data:image/jpeg;base64,${base64}`
                    }));


                    localStorage.setItem("profilePic", `data:image/jpeg;base64,${base64}`);

                    console.log(updateData);
                };

                reader.readAsDataURL(compressedFile);
            });
        }
    }

    async function updateUserData() {
        if (!Object.keys(updateData).length) {
            handleModalMessage({ isError: true, message: "Nenhuma informação foi alterada" });
            return;
        }

        try {
            const response = await updateUser(userData.id, updateData);

            if (!response.success) {
                handleModalMessage({ isError: true, message: response.message || "Erro ao atualizar dados" });
                return;
            }

            handleModalMessage({ isError: false, message: "Dados atualizados com sucesso!" });

            // Atualiza cookie local pra refletir o novo estado
            const newUserData = { ...userData, ...updateData };
            updateUserDataCookie(newUserData);

            setUpdateData({} as TUser);
            window.location.reload();
        } catch (err) {
            console.error(err);
            handleModalMessage({ isError: true, message: "Erro inesperado ao atualizar dados" });
        }
    }

    async function updateMyPassword() {
        if (!oldPassword || !newPassword || !confirmPassword) {
            handleModalMessage({ isError: true, message: "Preencha todos os campos de senha" });
            return;
        }

        if (newPassword.length < 8) {
            handleModalMessage({ isError: true, message: "A nova senha deve ter pelo menos 8 caracteres" });
            return;
        }

        if (newPassword !== confirmPassword) {
            handleModalMessage({ isError: true, message: "As novas senhas não conferem" });
            return;
        }

        try {
            const response = await updatePassword({
                oldPassword,
                newPassword,
                confirmPassword
            });

            if (!response.success) {
                handleModalMessage({ isError: true, message: response.message || "Erro ao atualizar senha" });
                return;
            }

            handleModalMessage({ isError: false, message: "Senha alterada com sucesso!" });

            const nextUserData = { ...userData, mustChangePassword: false };
            updateUserDataCookie(nextUserData);

            // Limpa os campos por segurança
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Limpa inputs visuais
            const inputs = document.querySelectorAll(".main-data-wrapper.password input");
            inputs.forEach(input => (input as HTMLInputElement).value = "");
        } catch (err) {
            console.error(err);
            handleModalMessage({ isError: true, message: "Erro inesperado ao atualizar senha" });
        }
    }

    return (
        <React.Fragment>
            <div className="main-profile-container">
                <AsideMenu notificationCount={Number(overviewData?.unreadNotifications)}/>
                <div className="profile-wrapper">
                    <div className="page-title-wrapper">
                        <b>Editar Informações</b>
                    </div>

                    <div className="main-data-wrapper personal">
                        <b>Dados Pessoais</b>

                        <div className="fields-wrapper">
                            <div className="data-wrapper">
                                <span>Nome</span>
                                <input type="text" name="firstName" id="firstName" value={updateData.hasOwnProperty("firstName") ? updateData.firstName : userData.firstName} onChange={setUpdatedData}/>
                            </div>

                            <div className="data-wrapper">
                                <span>Sobrenome</span>
                                <input type="text" name="lastName" id="lastName" value={updateData.hasOwnProperty("lastName") ? updateData.lastName : userData.lastName} onChange={setUpdatedData}/>
                            </div>

                            <div className="data-wrapper">
                                <span>Tipo de Documento</span>
                                <select name="docType" id="docType" value={updateData.hasOwnProperty("docType") ? updateData.docType : userData.docType} onChange={setUpdatedData}>
                                    <option value="">Selecionar</option>
                                    <option value="cpf">CPF</option>
                                    {/*<option value="nif">NIF</option>
                                    <option value="passport">PASSAPORTE</option>*/}
                                </select>
                            </div>

                            <div className="data-wrapper">
                                <span>Número do Documento</span>
                                <input type="text"  name="docId"  id="docId" inputMode="numeric" pattern="[0-9]*" value={updateData.hasOwnProperty("docId") ? updateData.docId : userData.docId} onKeyDown={(e) => { const allowedKeys = [  "Backspace", "Delete", "ArrowLeft",  "ArrowRight",  "Tab" ]; if (allowedKeys.includes(e.key)) return; if (!/^[0-9]$/.test(e.key)) { e.preventDefault(); } }} onChange={setUpdatedData} />
                            </div>

                            <div className="data-wrapper">
                                <span>Data de Nascimento</span>
                                <input type="date" name="birthDate" id="birthDate" value={updateData.hasOwnProperty("birthDate") ? updateData.birthDate : userData.birthDate} onChange={setUpdatedData}/>
                            </div>

                            <div className="data-wrapper">
                                <span>Gênero</span>
                                <select name="gender" id="gender" value={updateData.hasOwnProperty("gender") ? updateData.gender : userData.gender} onChange={setUpdatedData}>
                                    <option value="">Selecionar</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Feminino</option>
                                    <option value="nonBin">Não Binário</option>
                                    <option value="other">Prefiro não dizer</option>
                                </select>
                            </div>

                            <div className="data-wrapper">
                                <span>E-mail</span>
                                <input type="email" name="email" id="email" value={updateData.hasOwnProperty("email") ? updateData.email : userData.email} onChange={setUpdatedData}/>
                            </div>

                            <div className="data-wrapper">
                                <span>Telefone</span>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={updateData.hasOwnProperty("phone") ? updateData.phone : userData.phone}
                                    onChange={(e) => {
                                        e.target.value = e.target.value.replace(/\D/g, "");
                                        setUpdatedData(e);
                                    }}
                                />
                            </div>

                            <div className="data-wrapper">
                                <span>Foto de perfil</span>
                                <div>
                                    <div className="preview" style={{ backgroundImage: previewImage ? `url("${previewImage}")` : "none" }}  />
                                    <input type="file" name="profilePic" id="profilePic" onChange={setUpdatedData}/>
                                </div>
                            </div>
                        </div>

                        <button onClick={updateUserData}>Salvar Informações</button>
                    </div>

                    <div className="main-data-wrapper password">
                        <b>Segurança</b>

                        <div className="fields-wrapper">
                            <div className="data-wrapper">
                                <span>Senha Atual</span>
                                <input type="password" name="oldPass" id="oldPass" onChange={e => setOldPassword(e.currentTarget.value)} />
                            </div>

                            <div className="data-wrapper">
                                <span>Nova Senha</span>
                                <input type="password" name="newPass" id="newPass" onChange={e => setNewPassword(e.currentTarget.value)}/>
                            </div>
                            
                            <div className="data-wrapper">
                                <span>Confimar Nova Senha</span>
                                <input type="password" name="newPassConfirm" id="newPassConfirm" onChange={e => setConfirmPassword(e.currentTarget.value)} />
                            </div>
                        </div>

                        <button onClick={updateMyPassword}>Alterar Senha</button>
                    </div>
                </div>
            </div>
            <Footer />
            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    )
}

export default Profile;
